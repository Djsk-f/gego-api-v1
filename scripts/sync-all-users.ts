/**
 * Script : assigner les bons rôles et permissions à TOUS les utilisateurs.
 *
 * Pour chaque utilisateur en base :
 *   1. Lit user.type (CUSTOMER, COMPANY_ADMIN, SUPER_ADMIN, AGENCY_STAFF)
 *   2. Trouve le rôle dont le nom correspond (ex: user.type = 'COMPANY_ADMIN' → rôle 'COMPANY_ADMIN')
 *   3. Si le rôle n'existe pas → le crée avec les permissions par défaut
 *   4. Assigne roleId à l'utilisateur
 *
 * Usage :
 *   npx tsx scripts/sync-all-users.ts        # Dry-run
 *   npx tsx scripts/sync-all-users.ts --apply # Appliquer
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '..', '.env') });

import { DataSource } from 'typeorm';

// ─── Mapping profil → permissions ──────────────────────────────────────────

const ALL_PERMISSIONS = [
  { name: 'trip:create', description: 'Create trips' },
  { name: 'trip:read', description: 'Read trips' },
  { name: 'trip:update', description: 'Update trips' },
  { name: 'trip:cancel', description: 'Cancel trips' },
  { name: 'vehicle:create', description: 'Create vehicles' },
  { name: 'vehicle:read', description: 'Read vehicles' },
  { name: 'vehicle:update', description: 'Update vehicles' },
  { name: 'vehicle:delete', description: 'Delete vehicles' },
  { name: 'booking:read', description: 'Read bookings' },
  { name: 'booking:confirm', description: 'Confirm bookings' },
  { name: 'ticket:read', description: 'Read tickets' },
  { name: 'ticket:validate', description: 'Validate tickets' },
  { name: 'agency:create', description: 'Create agencies' },
  { name: 'agency:read', description: 'Read agencies' },
  { name: 'agency:update', description: 'Update agencies' },
  { name: 'agency:delete', description: 'Delete agencies' },
  { name: 'agency:user:create', description: 'Create agency users' },
  { name: 'agency:user:update', description: 'Update agency users' },
  { name: 'company:read', description: 'Read companies' },
  { name: 'company:update', description: 'Update companies' },
  { name: 'company:delete', description: 'Delete companies' },
  { name: 'user:read', description: 'Read users' },
  { name: 'user:update', description: 'Update users' },
  { name: 'user:delete', description: 'Delete users' },
  { name: 'location:manage', description: 'Manage locations (regions/cities)' },
  { name: 'location:disable', description: 'Disable cities for a company' },
];

interface ProfileConfig {
  permissions: string[];
}

const PROFILES: Record<string, ProfileConfig> = {
  SUPER_ADMIN: {
    permissions: ALL_PERMISSIONS.map((p) => p.name),
  },
  COMPANY_ADMIN: {
    permissions: [
      'trip:create', 'trip:read', 'trip:update', 'trip:cancel',
      'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
      'booking:read', 'booking:confirm',
      'ticket:read', 'ticket:validate',
      'agency:create', 'agency:read', 'agency:update', 'agency:delete',
      'agency:user:create', 'agency:user:update',
      'company:read', 'company:update', 'company:delete',
      'user:read', 'user:update', 'user:delete',
      'location:manage', 'location:disable',
    ],
  },
  AGENCY_STAFF: {
    permissions: [
      'trip:create', 'trip:read', 'trip:update', 'trip:cancel',
      'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
      'booking:read', 'booking:confirm',
      'ticket:read', 'ticket:validate',
      'agency:read', 'agency:user:create', 'agency:user:update',
      'user:read',
    ],
  },
  CUSTOMER: {
    permissions: ['trip:read', 'booking:read', 'ticket:read'],
  },
};

// ─── Connexion ──────────────────────────────────────────────────────────────

function getDbConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  }
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'gego',
  };
}

// ─── Fonctions ──────────────────────────────────────────────────────────────

function profileForType(type: string): string {
  switch (type) {
    case 'SUPER_ADMIN': return 'SUPER_ADMIN';
    case 'COMPANY_ADMIN': return 'COMPANY_ADMIN';
    case 'AGENCY_STAFF': return 'AGENCY_STAFF';
    case 'CUSTOMER': return 'CUSTOMER';
    default: return 'CUSTOMER';
  }
}

async function ensurePermissions(dataSource: DataSource, apply: boolean) {
  for (const perm of ALL_PERMISSIONS) {
    const [existing] = await dataSource.query(
      'SELECT id FROM permissions WHERE name = $1', [perm.name],
    );
    if (!existing) {
      console.log(`  ➕ Permission : ${perm.name}`);
      if (apply) {
        await dataSource.query(
          `INSERT INTO permissions (id, name, description, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
          [perm.name, perm.description ?? null],
        );
      }
    }
  }
}

async function ensureRole(dataSource: DataSource, profileName: string, apply: boolean): Promise<string> {
  const [existing] = await dataSource.query(
    'SELECT id FROM roles WHERE name = $1', [profileName],
  );
  if (existing) return existing.id;

  console.log(`  🆕 Rôle : ${profileName}`);
  if (apply) {
    const inserted = await dataSource.query(
      `INSERT INTO roles (id, name, description, scope, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, '', 'PLATFORM', NOW(), NOW())
       RETURNING id`,
      [profileName],
    );
    return inserted[0]?.id;
  }
  return '';
}

async function syncRolePermissions(dataSource: DataSource, roleId: string, profileName: string, apply: boolean) {
  const desiredPerms = PROFILES[profileName]?.permissions ?? [];
  if (desiredPerms.length === 0) return;

  // Récupérer les permissions actuelles du rôle
  const currentPerms: { name: string }[] = await dataSource.query(
    `SELECT p.name
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1`,
    [roleId],
  );
  const currentNames = new Set(currentPerms.map((p) => p.name));

  const toAdd = desiredPerms.filter((p) => !currentNames.has(p));
  for (const permName of toAdd) {
    console.log(`    ➕ ${profileName} ← ${permName}`);
    if (apply) {
      await dataSource.query(
        `INSERT INTO role_permissions (permission_id, role_id)
         SELECT p.id, $1 FROM permissions p WHERE p.name = $2
         ON CONFLICT DO NOTHING`,
        [roleId, permName],
      );
    }
  }
}

async function fixUser(dataSource: DataSource, user: any, apply: boolean) {
  const profileName = profileForType(user.type);
  const roleId = await ensureRole(dataSource, profileName, apply);
  if (!roleId) return; // dry-run, rôle pas encore créé

  if (user.role_id !== roleId) {
    console.log(`  👤 ${user.email || user.phone || user.id} (${user.type}) → roleId: ${roleId}`);
    if (apply) {
      await dataSource.query('UPDATE users SET "roleId" = $1 WHERE id = $2', [roleId, user.id]);
    }
  }

  await syncRolePermissions(dataSource, roleId, profileName, apply);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');

  const dbConfig = getDbConfig();
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log(`Connecté à ${dbConfig.database}@${dbConfig.host}\n`);

  if (!isApply) {
    console.log('🔍 DRY RUN — Utilisez --apply pour appliquer\n');
  }

  // 1. S'assurer que toutes les permissions existent
  console.log('Étape 1 — Permissions');
  await ensurePermissions(dataSource, isApply);

  // 2. Récupérer tous les utilisateurs
  console.log('\nÉtape 2 — Utilisateurs');
  const users = await dataSource.query(
    'SELECT id, type, email, phone, "roleId" AS role_id FROM users ORDER BY type, email',
  );
  console.log(`  ${users.length} utilisateur(s) trouvé(s)\n`);

  let fixed = 0;
  for (const user of users) {
    const profileName = profileForType(user.type);

    // Trouver le rôle idéal pour ce type
    const [role] = await dataSource.query(
      'SELECT id FROM roles WHERE name = $1', [profileName],
    );

    if (!role) {
      console.log(`  ⚠️  Rôle "${profileName}" inexistant — création nécessaire`);
      if (isApply) {
        const inserted = await dataSource.query(
          `INSERT INTO roles (id, name, description, scope, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, '', 'PLATFORM', NOW(), NOW())
           RETURNING id`,
          [profileName],
        );
        if (inserted[0]?.id) {
          await fixUser(dataSource, user, isApply);
          fixed++;
        }
      }
    } else {
      if (user.role_id !== role.id) {
        console.log(`  ✏️  ${user.email || user.phone || user.id} → rôle "${profileName}"`);
        if (isApply) {
          await dataSource.query('UPDATE users SET "roleId" = $1 WHERE id = $2', [role.id, user.id]);
        }
        fixed++;
      }
      await syncRolePermissions(dataSource, role.id, profileName, isApply);
    }
  }

  if (fixed === 0 && isApply) {
    console.log('  ✅ Tous les utilisateurs ont déjà le bon rôle');
  }

  if (isApply) {
    console.log(`\n✅ ${fixed} utilisateur(s) mis à jour`);
  } else {
    console.log(`\nℹ️  ${fixed} utilisateur(s) à corriger — lancez avec --apply`);
  }

  await dataSource.destroy();
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
