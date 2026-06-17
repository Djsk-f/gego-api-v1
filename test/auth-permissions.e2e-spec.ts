import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { SeedService } from './../src/database/seed.service';
import { UsersService } from './../src/modules/user/user.service';
import { Role } from './../src/modules/role/entities/role.entity';
import { Permission } from './../src/modules/role/entities/permission.entity';
import { AgencyUserRole } from './../src/modules/role/entities/agency-user-role.entity';
import { User, UserType, UserStatus } from './../src/modules/user/entities/user.entity';
import { Company } from './../src/modules/company/entities/company.entity';
import { Agency } from './../src/modules/agency/entities/agency.entity';
import { RefreshToken } from './../src/modules/auth/entities/refresh-token.entity';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import * as bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrait le `data` de la réponse wrapper `{ success, data, ... }` */
function unwrap(res: request.Response) {
  if (res.body.success) return res.body.data;
  return res.body;
}

function apiUrl(path: string): string {
  return `/api/v1${path}`;
}

// ─── Test data ─────────────────────────────────────────────────────────────────

const TEST_PREFIX = `e2e_${Date.now()}`;
const TEST_PASSWORD = 'Test123456!';

const testCustomer = {
  firstName: `${TEST_PREFIX}_customer_fn`,
  lastName: `${TEST_PREFIX}_customer_ln`,
  email: `${TEST_PREFIX}_customer@test.com`,
  password: TEST_PASSWORD,
};

const testCompanyAdmin = {
  firstName: `${TEST_PREFIX}_admin_fn`,
  lastName: `${TEST_PREFIX}_admin_ln`,
  email: `${TEST_PREFIX}_admin@test.com`,
  password: TEST_PASSWORD,
};

const testAgencyManager = {
  firstName: `${TEST_PREFIX}_mgr_fn`,
  lastName: `${TEST_PREFIX}_mgr_ln`,
  email: `${TEST_PREFIX}_mgr@test.com`,
  password: TEST_PASSWORD,
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth & Permissions (E2E)', () => {
  let app: INestApplication;
  let seedService: SeedService;
  let usersService: UsersService;
  let rolesRepository: Repository<Role>;
  let permissionsRepository: Repository<Permission>;
  let agencyUserRoleRepository: Repository<AgencyUserRole>;
  let companyRepository: Repository<Company>;
  let agencyRepository: Repository<Agency>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let jwtService: JwtService;

  // Stockage des données créées
  let createdCompany: Company;
  let createdAgency: Agency;
  let customerToken: string;
  let companyAdminToken: string;
  let agencyManagerToken: string;

  // ─── Setup ────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_GUARD)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // Récupérer les services / repositories depuis le DI
    seedService = app.get(SeedService);
    usersService = app.get(UsersService);
    rolesRepository = app.get(getRepositoryToken(Role));
    permissionsRepository = app.get(getRepositoryToken(Permission));
    agencyUserRoleRepository = app.get(getRepositoryToken(AgencyUserRole));
    companyRepository = app.get(getRepositoryToken(Company));
    agencyRepository = app.get(getRepositoryToken(Agency));
    userRepository = app.get(getRepositoryToken(User));
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  // ─── Nettoyage des données de test ────────────────────────────────────────

  afterAll(async () => {
    if (dataSource) {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(AgencyUserRole)
          .where('"userId" IN (SELECT id FROM "users" WHERE "email" LIKE :pattern)', {
            pattern: `${TEST_PREFIX}%`,
          })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(Agency)
          .where('"name" LIKE :pattern', { pattern: `${TEST_PREFIX}%` })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(Company)
          .where('"name" LIKE :pattern', { pattern: `${TEST_PREFIX}%` })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(User)
          .where('"email" LIKE :pattern', { pattern: `${TEST_PREFIX}%` })
          .execute();
      } finally {
        await queryRunner.release();
      }
    }

    if (app) await app.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PARTIE 1 : AUTH
  // ───────────────────────────────────────────────────────────────────────────

  describe('Auth — Register & Login', () => {
    it('POST /auth/register — crée un CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/auth/register'))
        .send(testCustomer)
        .expect(201);

      const data = unwrap(res);
      expect(data.user.firstName).toBe(testCustomer.firstName);
      expect(data.user.type).toBe(UserType.CUSTOMER);
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();

      // CUSTOMER n'a pas d'agencyUserRole, donc pas de membreships
      // Ses permissions sont portées par user.role mais pas dans un membership
      expect(data.memberships).toEqual([]);

      customerToken = data.accessToken;
    });

    it('POST /auth/login — connecte un CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/auth/login'))
        .send({ identifier: testCustomer.email, password: testCustomer.password })
        .expect(201);

      const data = unwrap(res);
      expect(data.user.type).toBe(UserType.CUSTOMER);
      expect(data.accessToken).toBeDefined();
    });

    it('POST /auth/login — échoue avec mauvais mot de passe', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/auth/login'))
        .send({ identifier: testCustomer.email, password: 'wrong_password' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });

    it('POST /auth/login — échoue avec identifiant inconnu', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/auth/login'))
        .send({ identifier: 'unknown@test.com', password: TEST_PASSWORD })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Auth — Me, Refresh, Logout', () => {
    it('GET /auth/me — retourne l\'utilisateur connecté', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/auth/me'))
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const data = unwrap(res);
      expect(data.user.email).toBe(testCustomer.email);
      expect(data.memberships).toBeDefined();
    });

    it('GET /auth/me — 401 sans token', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/auth/me'))
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('POST /auth/refresh — rafraîchit les tokens', async () => {
      // D'abord login pour avoir un refresh token
      const loginRes = await request(app.getHttpServer())
        .post(apiUrl('/auth/login'))
        .send({ identifier: testCustomer.email, password: testCustomer.password })
        .expect(201);

      const loginData = unwrap(loginRes);
      const refreshToken = loginData.refreshToken;

      const res = await request(app.getHttpServer())
        .post(apiUrl('/auth/refresh'))
        .send({ refreshToken })
        .expect(201);

      const data = unwrap(res);
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      // Le nouveau token doit être différent (rotation)
      expect(data.accessToken).not.toBe(loginData.accessToken);
    });

    it('POST /auth/logout — révoque le refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post(apiUrl('/auth/login'))
        .send({ identifier: testCustomer.email, password: testCustomer.password })
        .expect(201);

      const loginData = unwrap(loginRes);
      const refreshToken = loginData.refreshToken;

      // Décoder le JWT pour obtenir le userId
      const decoded = jwtService.decode(refreshToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBeDefined();

      // Compter les tokens révoqués AVANT logout
      const refreshTokensRepo = app.get(getRepositoryToken(RefreshToken));
      const tokensBefore = await refreshTokensRepo.find({
        where: { userId: decoded.sub },
      });
      const revokedCountBefore = tokensBefore.filter((t) => t.revokedAt).length;

      await request(app.getHttpServer())
        .post(apiUrl('/auth/logout'))
        .send({ refreshToken })
        .expect(201);

      // Vérifier en base qu'au moins un nouveau token a été révoqué
      const tokensAfter = await refreshTokensRepo.find({
        where: { userId: decoded.sub },
      });
      const revokedCountAfter = tokensAfter.filter((t) => t.revokedAt).length;
      expect(revokedCountAfter).toBeGreaterThan(revokedCountBefore);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PARTIE 2 : PERMISSIONS — Création des données de test (Company, Agency,
  //             COMPANY_ADMIN, AGENCY_MANAGER) via l'API
  // ───────────────────────────────────────────────────────────────────────────

  describe('Permissions — Setup des données de test', () => {
    let superAdminToken: string;

    it('Crée un SUPER_ADMIN directement en base pour bootstrap', async () => {
      // On a besoin d'un SUPER_ADMIN pour créer la compagnie (POST /companies)
      // Le SUPER_ADMIN bypass le PermissionsGuard
      const role = await rolesRepository.findOne({ where: { name: 'SUPER_ADMIN' } });
      expect(role).toBeDefined();

      const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
      const superUser = userRepository.create({
        firstName: `${TEST_PREFIX}_super`,
        lastName: `${TEST_PREFIX}_super`,
        email: `${TEST_PREFIX}_super@test.com`,
        passwordHash,
        type: UserType.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        roleId: role!.id,
      });
      await userRepository.save(superUser);

      // Générer un JWT directement (évite le rate limiter du endpoint /auth/login)
      const payload = { sub: superUser.id, type: superUser.type };
      superAdminToken = await jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });
    });

    it('POST /companies — crée une compagnie (SUPER_ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/companies'))
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: `${TEST_PREFIX}_company` })
        .expect(201);

      const data = unwrap(res);
      createdCompany = data;
      expect(createdCompany.id).toBeDefined();
      expect(createdCompany.name).toContain(TEST_PREFIX);
    });

    it('POST /companies/:id/admins — crée COMPANY_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`/companies/${createdCompany.id}/admins`))
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: testCompanyAdmin.firstName,
          lastName: testCompanyAdmin.lastName,
          email: testCompanyAdmin.email,
          password: testCompanyAdmin.password,
        })
        .expect(201);

      // Vérifier que le COMPANY_ADMIN a bien un roleId
      const savedAdmin = await userRepository.findOne({
        where: { email: testCompanyAdmin.email },
        relations: { role: true },
      });
      expect(savedAdmin).toBeDefined();
      expect(savedAdmin!.role).toBeDefined();
      expect(savedAdmin!.role!.name).toBe('COMPANY_ADMIN');
    });

    it('POST /agencies — crée une agence (en tant que COMPANY_ADMIN)', async () => {
      // Créer un JWT directement pour le COMPANY_ADMIN (évite le rate limiter)
      const adminUser = await userRepository.findOne({
        where: { email: testCompanyAdmin.email },
        relations: { role: { permissions: true } },
      });
      expect(adminUser).toBeDefined();

      const adminPayload = { sub: adminUser!.id, type: adminUser!.type };
      companyAdminToken = await jwtService.signAsync(adminPayload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });

      // Vérifier les permissions du rôle COMPANY_ADMIN en base
      const adminPerms = adminUser!.role?.permissions?.map((p) => p.name) ?? [];
      expect(adminPerms).toContain('agency:create');
      expect(adminPerms).toContain('agency:read');
      expect(adminPerms).toContain('company:read');

      // Créer l'agence
      const res = await request(app.getHttpServer())
        .post(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .send({ name: `${TEST_PREFIX}_agency`, city: 'TestCity' })
        .expect(201);

      const data = unwrap(res);
      createdAgency = data;
      expect(createdAgency.id).toBeDefined();
      expect(createdAgency.name).toContain(TEST_PREFIX);
    });

    it('POST /agencies/:id/staff — crée un AGENCY_MANAGER', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`/agencies/${createdAgency.id}/staff`))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .send({
          firstName: testAgencyManager.firstName,
          lastName: testAgencyManager.lastName,
          email: testAgencyManager.email,
          password: testAgencyManager.password,
          roleName: 'AGENCY_MANAGER',
        })
        .expect(201);

      // Vérifier que l'user a bien un rôle et companyId
      const savedMgr = await userRepository.findOne({
        where: { email: testAgencyManager.email },
        relations: { role: { permissions: true } },
      });
      expect(savedMgr).toBeDefined();
      expect(savedMgr!.role!.name).toBe('AGENCY_MANAGER');
      expect(savedMgr!.companyId).toBe(createdCompany.id);

      // Créer un JWT directement pour l'AGENCY_MANAGER (évite le rate limiter)
      const mgrPayload = { sub: savedMgr!.id, type: savedMgr!.type };
      agencyManagerToken = await jwtService.signAsync(mgrPayload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });

      // Vérifier les permissions du rôle AGENCY_MANAGER en base
      const mgrPerms = savedMgr!.role?.permissions?.map((p) => p.name) ?? [];
      expect(mgrPerms).toContain('agency:read');
      expect(mgrPerms).toContain('user:read');
      expect(mgrPerms).toContain('trip:create');
      expect(mgrPerms).not.toContain('agency:create'); // il ne peut PAS créer d'agence
      expect(mgrPerms).not.toContain('company:read');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PARTIE 3 : PERMISSIONS — Vérification des accès
  // ───────────────────────────────────────────────────────────────────────────

  describe('Permissions — Accès aux agences', () => {
    it('GET /agencies — CUSTOMER obtient 403', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${customerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(403);

      expect(res.body.message).toMatch(/insufficient permissions/i);
    });

    it('GET /agencies — AGENCY_MANAGER obtient 200', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /agencies — COMPANY_ADMIN obtient 200', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /agencies — 403 sans header X-Company-Id', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(403);

      // PermissionsGuard global peut passer avant TenantGuard selon l'ordre d'exécution
      expect(res.body.statusCode).toBe(403);
    });

    it('GET /agencies — 403 avec mauvais X-Company-Id', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', '00000000-0000-0000-0000-000000000000')
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('GET /agencies — 401 sans token', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/agencies'))
        .set('X-Company-Id', createdCompany.id)
        .expect(401);
    });
  });

  describe('Permissions — Création d\'agence', () => {
    it('POST /agencies — AGENCY_MANAGER obtient 403 (pas agency:create)', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .send({ name: `${TEST_PREFIX}_should_fail`, city: 'TestCity' })
        .expect(403);

      expect(res.body.message).toMatch(/insufficient permissions/i);
    });

    it('POST /agencies — COMPANY_ADMIN obtient 200', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('/agencies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .send({ name: `${TEST_PREFIX}_agency_2`, city: 'TestCity' })
        .expect(201);

      const data = unwrap(res);
      expect(data.name).toContain(TEST_PREFIX);
    });
  });

  describe('Permissions — Staff de l\'agence', () => {
    it('GET /agencies/:id/staff — COMPANY_ADMIN peut voir le staff', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`/agencies/${createdAgency.id}/staff`))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
      // La liste doit contenir l'AGENCY_MANAGER qu'on a créé
      const mgr = data.find(
        (u: { user: { email: string } }) => u.user.email === testAgencyManager.email,
      );
      expect(mgr).toBeDefined();
    });

    it('GET /agencies/:id/staff — AGENCY_MANAGER peut voir le staff (user:read)', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`/agencies/${createdAgency.id}/staff`))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Permissions — Compagnies', () => {
    it('GET /companies — COMPANY_ADMIN obtient 200 (company:read)', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/companies'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /companies — AGENCY_MANAGER obtient 403 (pas company:read)', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/companies'))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .expect(403);

      expect(res.body.message).toMatch(/insufficient permissions/i);
    });

    it('GET /companies — CUSTOMER obtient 403', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/companies'))
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Permissions — Users', () => {
    it('GET /users — COMPANY_ADMIN obtient 200 (user:read)', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/users'))
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /users — AGENCY_MANAGER obtient 200 (user:read)', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/users'))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /users — CUSTOMER obtient 403', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('/users'))
        .set('Authorization', `Bearer ${customerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .expect(403);
    });
  });

  describe('Permissions — Trips & Vehicles (sans @Permissions)', () => {
    it('GET /trips/search — accès public (pas de guard)', async () => {
      // Le search nécessite au moins departureCity ou arrivalCity
      const res = await request(app.getHttpServer())
        .get(apiUrl('/trips/search?departureCity=Test&arrivalCity=Test2'))
        .expect(200);

      const data = unwrap(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('POST /trips — AGENCY_MANAGER peut créer un trajet (trip:create)', async () => {
      // Note: requires a vehicle and route data; for now test that the guard passes
      // We test the permission, not the full creation

      // Skip si createdCompany ou createdAgency sont undefined (cascade d'échecs précédents)
      if (!createdCompany || !createdAgency) return;

      const res = await request(app.getHttpServer())
        .post(apiUrl('/trips'))
        .set('Authorization', `Bearer ${agencyManagerToken}`)
        .set('X-Company-Id', createdCompany.id)
        .set('X-Agency-Id', createdAgency.id)
        .send({
          departureCity: 'Test City',
          arrivalCity: 'Test City 2',
          departureTime: new Date(Date.now() + 86400000).toISOString(),
          arrivalTime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
          price: 5000,
          vehicleId: '00000000-0000-0000-0000-000000000000', // va échouer sur la validité du véhicule, pas sur la permission
        });

      // On s'attend à ce que la permission soit validée (pas de 401/403).
      // L'erreur sera sur la donnée (véhicule inexistant, contrainte DB, etc.)
      // On accepte donc 400, 404 ou 500 — tout sauf 401 ou 403.
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
