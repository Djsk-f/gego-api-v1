# GEGO API Agent Guidelines

## Project Context

GEGO is a travel ticket booking platform built with NestJS, PostgreSQL, and TypeORM.

Core business concepts:

- Companies operate regional agencies.
- Agencies manage staff, vehicles, trips, bookings, tickets, and payments.
- Customers search trips, create bookings, pay, and receive tickets.
- Staff permissions are scoped by agency through RBAC.

## Technical Choices

- Runtime framework: NestJS 11.
- Database: PostgreSQL.
- ORM: TypeORM.
- Entity IDs: UUID primary keys.
- API prefix: `/api/v1`.
- Auth model: JWT access token + refresh token.
- Payment providers initially mocked: MTN Mobile Money and Orange Money.

## Architecture Rules

Use a modular NestJS architecture with clear separation:

```txt
src/
  common/
  config/
  database/
  modules/
    auth/
    company/
    agency/
    user/
    role/
    vehicle/
    trip/
    booking/
    ticket/
    payment/
```

Each business module should progressively follow:

```txt
module/
  dto/
  entities/
  module.ts
  service.ts
  controller.ts
```

For complex domains, evolve toward:

```txt
domain/
application/
infrastructure/
presentation/
```

## Multi-Tenant Rules

- Every tenant-owned business entity must include `companyId`.
- Agency-scoped entities should also include `agencyId`.
- Never trust `companyId` or `agencyId` from the request body.
- Tenant context must come from authenticated context and validated headers:
  - `X-Company-Id`
  - `X-Agency-Id`
- Guards must prevent cross-company and cross-agency access.

## RBAC Rules

Roles are contextual, not global.

Use `AgencyUserRole` to represent:

```txt
User + Company + Agency + Role
```

Initial roles:

- `SUPER_ADMIN`
- `COMPANY_ADMIN`
- `AGENCY_MANAGER`
- `TICKET_AGENT`
- `VEHICLE_MANAGER`
- `CUSTOMER`

Initial permissions:

- `trip:create`
- `trip:read`
- `trip:update`
- `trip:cancel`
- `vehicle:create`
- `vehicle:read`
- `vehicle:update`
- `vehicle:delete`
- `driver:create`
- `driver:read`
- `driver:update`
- `driver:delete`
- `booking:read`
- `booking:confirm`
- `ticket:read`
- `ticket:validate`
- `agency:user:create`
- `agency:user:update`

## Authentication Workflow

Implement auth in this order:

1. Create `AuthModule`.
2. Add password hashing with bcrypt or argon2.
3. Add JWT access token support.
4. Add refresh token storage with hashed refresh tokens.
5. Add login endpoint.
6. Add customer register endpoint.
7. Add refresh endpoint with token rotation.
8. Add logout endpoint with refresh token revocation.
9. Add `JwtAuthGuard`.
10. Add `CurrentUser` integration.
11. Add permission checks after user/role persistence is complete.

Recommended endpoints:

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Auth Response Contract

Use this response shape for mobile compatibility:

```txt
{
  user: {
    id,
    firstName,
    lastName,
    email,
    phone,
    type,
    status
  },
  accessToken,
  refreshToken,
  memberships: [
    {
      companyId,
      agencyId,
      role,
      permissions
    }
  ]
}
```

## Payment Rules

Initial payment integration should be mocked but provider-oriented.

Supported mock providers:

- `MTN_MOMO`
- `ORANGE_MONEY`

Design payment code so real providers can replace mocks later without changing booking logic.

## Base Service Pattern

Every module service should extend `BaseService<T>` from `src/common/services/base.service`.

`BaseService` provides default CRUD:

```txt
create(dto: DeepPartial<T>) -> T
findAll(options?: FindManyOptions<T>) -> T[]
findOne(options: FindOneOptions<T>) -> T
findById(id: string, relations?) -> T
update(id: string, dto: DeepPartial<T>) -> T
remove(id: string) -> void
```

Service-specific methods must use a prefixed name to avoid shadowing base methods:

```txt
createTrip(dto: CreateTripDto)       // instead of create
findByCompany(companyId)             // instead of findAll scoped
findTripById(id, companyId)          // instead of findOne scoped
updateTrip(id, companyId, dto)      // instead of update scoped
deleteTrip(id, companyId)            // instead of remove scoped
```

## Module Helpers

Each complex module must have a `helpers/` folder for pure business logic:

```txt
module/
  helpers/
    validation.helper.ts
    pricing.helper.ts
    generator.helper.ts
```

Rules:
- Helpers are stateless functions, never classes.
- They receive `EntityManager` for transactional contexts.
- They throw NestJS exceptions (`BadRequestException`, `NotFoundException`).
- They enforce single responsibility: one helper = one concern.

## Enums

All enums must live inside the entity file they belong to, or in a dedicated `enums/` folder if shared across modules. Never define enums inline in DTOs or services.

## Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`).
- Never return `null` silently; always throw.
- Validation logic lives in helpers, not services.
- BaseService handles the default "not found" case.

## Single Responsibility Principle

- One service method = one action (e.g. `createBooking`, `validateTicket`).
- Extract branching logic into helpers.
- Keep controllers thin: only routing + guard + DTO + single service call.
- Services orchestrate; helpers validate and compute.

## Code Quality Rules

- Keep imports at the top of files.
- Prefer DTO validation with `class-validator`.
- Use transactions for booking/payment/ticket flows.
- Keep controllers thin and services/use-cases responsible for business orchestration.
- Run `npm run build` after meaningful backend changes.
