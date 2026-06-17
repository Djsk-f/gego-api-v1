/**
 * Script one-shot pour ajouter les valeurs d'enum manquantes dans la base PostgreSQL.
 *
 * PostgreSQL 12+ interdit d'utiliser une valeur d'enum fraîchement ajoutée
 * (via ALTER TYPE ... ADD VALUE) dans la même transaction.
 * Ce script ajoute les valeurs manquantes une par une, chacune dans sa propre
 * transaction auto-commit, pour éviter ce problème.
 *
 * Usage:
 *   npx tsx scripts/fix-enum-types.ts
 *
 * Prérequis : base PostgreSQL accessible via les vars d'env du projet.
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

config({ path: resolve(__dirname, '..', '.env') });

/**
 * Tous les types enum PostgreSQL attendus, avec leurs valeurs complètes
 * telles que définies dans les entités TypeORM.
 */
const EXPECTED_ENUMS: Record<string, string[]> = {
  tickets_status_enum:         ['PENDING', 'PAID', 'VALIDATED', 'EXPIRED'],
  bookings_status_enum:        ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'],
  payments_status_enum:        ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
  companies_status_enum:       ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  regions_scope_enum:          ['GLOBAL', 'COMPANY'],
  cities_scope_enum:           ['GLOBAL', 'COMPANY'],
  vehicles_type_enum:          ['BUS', 'MINIBUS', 'CAR'],
  vehicles_status_enum:        ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
  drivers_status_enum:         ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  agencies_status_enum:        ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  users_type_enum:             ['CUSTOMER', 'AGENCY_STAFF', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
  users_status_enum:           ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  trips_status_enum:           ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
  agency_user_roles_status_enum: ['ACTIVE', 'INACTIVE'],
};

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
  console.log(`Connecté à ${dbConfig.database}@${dbConfig.host}\n`);
  return dataSource;
}

// ─────────────────────────────── Enum helpers ───────────────────────────────

async function getExistingValues(ds: DataSource, typeName: string): Promise<Set<string>> {
  const rows = await ds.query<{ value: string }[]>(
    `SELECT e.enumlabel AS value
     FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typname = $1
     ORDER BY e.enumsortorder`,
    [typeName],
  );
  return new Set(rows.map((r) => r.value));
}

async function typeExists(ds: DataSource, typeName: string): Promise<boolean> {
  const [row] = await ds.query<{ exists: boolean }[]>(
    `SELECT EXISTS(
       SELECT 1 FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = $1
       AND t.typtype = 'e'
     ) AS exists`,
    [typeName],
  );
  return row?.exists ?? false;
}

// ─────────────────────────────── Main ───────────────────────────────────────

async function main(): Promise<void> {
  const ds = await createDataSource();
  let hasChanges = false;

  for (const [typeName, expectedValues] of Object.entries(EXPECTED_ENUMS)) {
    const exists = await typeExists(ds, typeName);
    if (!exists) {
      console.log(`⚠️  ${typeName} — le type n'existe pas encore dans la DB (créé au 1er run de l'app)`);
      continue;
    }

    const existing = await getExistingValues(ds, typeName);
    const missing = expectedValues.filter((v) => !existing.has(v));

    if (missing.length === 0) {
      console.log(`✅ ${typeName} — à jour (${existing.size} valeurs)`);
      continue;
    }

    hasChanges = true;
    for (const value of missing) {
      console.log(`🔧 ${typeName} → ajout de '${value}'`);
      await ds.query(`ALTER TYPE "public"."${typeName}" ADD VALUE '${value}'`);
      console.log(`   ✅ '${value}' ajouté`);
    }
  }

  if (!hasChanges) {
    console.log('\n✅ Tous les types enum sont déjà à jour.');
  } else {
    console.log('\n✅ Types enum mis à jour avec succès.');
    console.log('   Vous pouvez maintenant relancer l\'application.');
  }

  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
