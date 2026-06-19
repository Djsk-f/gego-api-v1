/**
 * Script CLI pour synchroniser les permissions par profil (rôle).
 *
 * Usage:
 *   npx tsx scripts/sync-permissions.ts              # Dry-run par défaut
 *   npx tsx scripts/sync-permissions.ts --apply       # Applique les changements
 *   npx tsx scripts/sync-permissions.ts --list        # Liste les permissions actuelles
 *
 * Prérequis : une base PostgreSQL accessible via les vars d'env du projet.
 * Lit la config depuis .env ou les env vars.
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

config({ path: resolve(__dirname, '..', '.env') });

// ─────────────────────────────── Types ──────────────────────────────────────

interface Permission {
  name: string;
  description: string;
}

interface RoleConfig {
  name: string;
  permissions: string[];
}

interface DbRole {
  id: string;
}

interface DbPermission {
  name: string;
}

// ─────────────────────────────── Config des permissions par rôle ─────────────

const ALL_PERMISSIONS: Permission[] = [
  { name: 'trip:create',        description: 'Create trips' },
  { name: 'trip:read',          description: 'Read trips' },
  { name: 'trip:update',        description: 'Update trips' },
  { name: 'trip:cancel',        description: 'Cancel trips' },
  { name: 'vehicle:create',     description: 'Create vehicles' },
  { name: 'vehicle:read',       description: 'Read vehicles' },
  { name: 'vehicle:update',     description: 'Update vehicles' },
  { name: 'vehicle:delete',     description: 'Delete vehicles' },
  { name: 'driver:create',      description: 'Create drivers' },
  { name: 'driver:read',        description: 'Read drivers' },
  { name: 'driver:update',      description: 'Update drivers' },
  { name: 'driver:delete',      description: 'Delete drivers' },
  { name: 'booking:read',       description: 'Read bookings' },
  { name: 'booking:confirm',    description: 'Confirm bookings' },
  { name: 'ticket:read',        description: 'Read tickets' },
  { name: 'ticket:validate',    description: 'Validate tickets' },
  { name: 'agency:create',      description: 'Create agencies' },
  { name: 'agency:read',        description: 'Read agencies' },
  { name: 'agency:update',      description: 'Update agencies' },
  { name: 'agency:delete',      description: 'Delete agencies' },
  { name: 'agency:user:create', description: 'Create agency users' },
  { name: 'agency:user:update', description: 'Update agency users' },
  { name: 'company:read',       description: 'Read companies' },
  { name: 'company:update',     description: 'Update companies' },
  { name: 'company:delete',     description: 'Delete companies' },
  { name: 'user:read',          description: 'Read users' },
  { name: 'user:update',        description: 'Update users' },
  { name: 'user:delete',        description: 'Delete users' },
  { name: 'location:manage',    description: 'Manage locations (regions/cities)' },
  { name: 'location:disable',   description: 'Disable cities for a company' },
  { name: 'route:create',       description: 'Create routes' },
  { name: 'route:read',         description: 'Read routes' },
  { name: 'route:update',       description: 'Update routes' },
  { name: 'route:delete',       description: 'Delete routes' },
];

const ALL_PERMISSION_NAMES = ALL_PERMISSIONS.map((p) => p.name);

const ROLES_CONFIG: RoleConfig[] = [
  {
    name: 'SUPER_ADMIN',
    permissions: ALL_PERMISSION_NAMES,
  },
  {
    name: 'COMPANY_ADMIN',
    permissions: [
      'trip:create', 'trip:read', 'trip:update', 'trip:cancel',
      'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
      'driver:create', 'driver:read', 'driver:update', 'driver:delete',
      'booking:read', 'booking:confirm',
      'ticket:read', 'ticket:validate',
      'agency:create', 'agency:read', 'agency:update', 'agency:delete',
      'agency:user:create', 'agency:user:update',
      'company:read', 'company:update', 'company:delete',
      'user:read', 'user:update', 'user:delete',
      'location:manage', 'location:disable',
      'route:create', 'route:read', 'route:update', 'route:delete',
    ],
  },
  {
    name: 'AGENCY_MANAGER',
    permissions: [
      'trip:create', 'trip:read', 'trip:update', 'trip:cancel',
      'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
      'driver:create', 'driver:read', 'driver:update', 'driver:delete',
      'booking:read', 'booking:confirm',
      'ticket:read', 'ticket:validate',
      'agency:read',
      'agency:user:create', 'agency:user:update',
      'user:read',
      'route:read',
    ],
  },
  {
    name: 'TICKET_AGENT',
    permissions: [
      'trip:read',
      'booking:read', 'booking:confirm',
      'ticket:read', 'ticket:validate',
    ],
  },
  {
    name: 'VEHICLE_MANAGER',
    permissions: [
      'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
      'driver:create', 'driver:read', 'driver:update', 'driver:delete',
      'trip:read',
    ],
  },
  {
    name: 'CUSTOMER',
    permissions: [
      'trip:read',
      'booking:read',
      'ticket:read',
    ],
  },
];

// ─────────────────────────────── Database connection ────────────────────────

function buildDbConfig() {
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
    host:     process.env.DATABASE_HOST     || 'localhost',
    port:     Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME     || 'gego',
  };
}

async function createDataSource(): Promise<DataSource> {
  const dbConfig = buildDbConfig();
  const dataSource = new DataSource({
    type: 'postgres',
    ...dbConfig,
    synchronize: false,
    logging: false,
  });
  await dataSource.initialize();
  console.log(`Connected to ${dbConfig.database}@${dbConfig.host}\n`);
  return dataSource;
}

// ─────────────────────────────── DB helpers ──────────────────────────────────

async function findRole(ds: DataSource, name: string): Promise<DbRole | undefined> {
  const [role] = await ds.query<DbRole[]>('SELECT id FROM roles WHERE name = $1', [name]);
  return role;
}

async function findPermission(ds: DataSource, name: string): Promise<{ id: string } | undefined> {
  const [perm] = await ds.query<{ id: string }[]>('SELECT id FROM permissions WHERE name = $1', [name]);
  return perm;
}

async function getRolePermissions(ds: DataSource, roleId: string): Promise<Set<string>> {
  const rows = await ds.query<DbPermission[]>(
    `SELECT p.name
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1`,
    [roleId],
  );
  return new Set(rows.map((r) => r.name));
}

// ─────────────────────────────── Dry-run wrapper ─────────────────────────────

type Action = () => Promise<void>;

/**
 * Exécute `action` seulement si `apply` est vrai.
 * Dans les deux cas, `label` est affiché dans la console.
 */
async function run(apply: boolean, label: string, action: Action): Promise<void> {
  console.log(label);
  if (apply) await action();
}

// ─────────────────────────────── List current state ─────────────────────────

async function listPermissions(ds: DataSource): Promise<void> {
  const roles = await ds.query<{ role_name: string; permissions: string[] | null }[]>(
    `SELECT r.name AS role_name,
            json_agg(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL) AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     GROUP BY r.name
     ORDER BY r.name`,
  );

  for (const { role_name, permissions } of roles) {
    console.log(`\n${role_name}:`);
    if (!permissions?.length) {
      console.log('  (aucune permission)');
    } else {
      permissions.forEach((p) => console.log(`  ✅ ${p}`));
    }
  }

  const [{ count }] = await ds.query<{ count: number }[]>(
    'SELECT COUNT(*)::int AS count FROM permissions',
  );
  console.log(`\nTotal permissions dans la DB : ${count}`);
}

// ─────────────────────────────── Sync logic ─────────────────────────────────

async function syncMissingPermissions(ds: DataSource, apply: boolean): Promise<void> {
  for (const { name, description } of ALL_PERMISSIONS) {
    if (await findPermission(ds, name)) continue;

    await run(apply, `➕ Permission à créer : ${name}`, () =>
      ds.query(
        `INSERT INTO permissions (id, name, description, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
        [name, description ?? null],
      ),
    );
  }
}

async function syncRolePermissions(
  ds: DataSource,
  roleConfig: RoleConfig,
  apply: boolean,
): Promise<void> {
  // Créer le rôle s'il n'existe pas encore
  let role = await findRole(ds, roleConfig.name);
  if (!role) {
    await run(apply, `🆕 Rôle à créer : ${roleConfig.name}`, () =>
      ds.query(
        `INSERT INTO roles (id, name, description, scope, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, '', 'PLATFORM', NOW(), NOW())`,
        [roleConfig.name],
      ),
    );
    // Re-fetch après création (no-op en dry-run : role restera undefined)
    role = await findRole(ds, roleConfig.name);
    if (!role) return;
  }

  const currentPermNames = await getRolePermissions(ds, role.id);
  const desiredPermNames = new Set(roleConfig.permissions);

  const toAdd    = roleConfig.permissions.filter((p) => !currentPermNames.has(p));
  const toRemove = [...currentPermNames].filter((p) => !desiredPermNames.has(p));

  if (!toAdd.length && !toRemove.length) {
    console.log(`✅ ${roleConfig.name} — à jour`);
    return;
  }

  for (const permName of toAdd) {
    await run(apply, `  ➕ ${roleConfig.name} <- ${permName}`, () =>
      ds.query(
        `INSERT INTO role_permissions (permission_id, role_id)
         SELECT p.id, $1 FROM permissions p WHERE p.name = $2
         ON CONFLICT DO NOTHING`,
        [role!.id, permName],
      ),
    );
  }

  for (const permName of toRemove) {
    await run(apply, `  ➖ ${roleConfig.name} - ${permName}`, () =>
      ds.query(
        `DELETE FROM role_permissions
         WHERE role_id = $1
           AND permission_id = (SELECT id FROM permissions WHERE name = $2)`,
        [role!.id, permName],
      ),
    );
  }
}

async function syncPermissions(ds: DataSource, apply: boolean): Promise<void> {
  await syncMissingPermissions(ds, apply);
  for (const roleConfig of ROLES_CONFIG) {
    await syncRolePermissions(ds, roleConfig, apply);
  }
}

// ─────────────────────────────── Entry point ─────────────────────────────────

async function main(): Promise<void> {
  const args    = new Set(process.argv.slice(2));
  const isList  = args.has('--list');
  const isApply = args.has('--apply');

  const ds = await createDataSource();

  try {
    if (isList) {
      await listPermissions(ds);
      return;
    }

    if (!isApply) console.log('🔍 DRY RUN — Use --apply to persist changes\n');

    await syncPermissions(ds, isApply);

    console.log(
      isApply
        ? '\n✅ Synchronisation terminée.'
        : '\nℹ️  Run with --apply to apply the changes above.',
    );
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});