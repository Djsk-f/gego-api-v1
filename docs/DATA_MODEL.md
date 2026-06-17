# GEGO - Plan du Modèle de Données (Data Model)

## Vue d'ensemble

**Total : 18 entités** dont **10 existantes** et **8 à créer**.

Architecture multi-tenant (company/agency) avec UUID partout. Pas de suppression physique sur les données métier critiques (soft delete ou archivage).

---

## 1. Entités Existantes (10)

```
Company          → racine du tenant
Agency           → appartient à Company
User             → client + staff + admin
Role             → rôles globaux
Permission       → permissions globales
AgencyUserRole   → jointure User+Company+Agency+Role
Vehicle          → appartient à Agency
Trip             → appartient à Agency + Vehicle
RefreshToken     → auth
```

## 2. Entités à Créer (8)

```
Driver           → appartient à Agency
Booking          → réservation par User pour un Trip
Ticket           → billet numérique (QR) issu d'un Booking
Payment          → transaction liée à un Booking
TripStop         → arrêts intermédiaires d'un Trip
Rating           → notation (agence, voyage, chauffeur)
Comment          → avis texte sur une agence/voyage
LoyaltyTransaction → points fidélité gagnés/dépensés
```

---

## 3. Diagramme des Relations

```text
Company (1)
  ├── Agency (N)
  │     ├── Vehicle (N)
  │     │     └── Trip (N)
  │     ├── Driver (N)
  │     │     └── Trip (N) [optionnel]
  │     ├── Trip (N)
  │     │     ├── TripStop (N)
  │     │     ├── Booking (N)
  │     │     │     ├── Ticket (1)
  │     │     │     ├── Payment (1)
  │     │     │     └── LoyaltyTransaction (N)
  │     │     └── Rating (N) [sur le trip]
  │     ├── AgencyUserRole (N)
  │     ├── Rating (N) [sur l'agence]
  │     └── Comment (N)
  ├── AgencyUserRole (N)
  └── Role/Permission (globaux)

User (1)
  ├── Booking (N)
  ├── Rating (N)
  ├── Comment (N)
  ├── LoyaltyTransaction (N)
  └── AgencyUserRole (N) [si staff]
```

---

## 4. Détail des Nouvelles Entités

### 4.1 Driver (Chauffeur)

```typescript
@Entity('drivers')
@Index(['companyId', 'agencyId'])
class Driver {
  id: UUID                    // PK
  companyId: UUID             // FK → Company
  agencyId: UUID              // FK → Agency
  firstName: string
  lastName: string
  phone: string
  licenseNumber: string        // numéro permis
  rating: number              // moyenne 0-5
  totalTrips: number
  status: ACTIVE | INACTIVE | SUSPENDED
  createdAt: Date
  updatedAt: Date

  // Relations
  agency: ManyToOne → Agency
  trips: OneToMany → Trip
  ratings: OneToMany → Rating (type=DRIVER)
}
```

### 4.2 Booking (Réservation)

```typescript
@Entity('bookings')
@Index(['userId'])
@Index(['tripId'])
@Index(['companyId', 'agencyId'])
@Index(['status'])
class Booking {
  id: UUID                    // PK
  companyId: UUID             // FK → Company
  agencyId: UUID              // FK → Agency
  userId: UUID                // FK → User
  tripId: UUID                // FK → Trip
  seatNumber: string          // ex: "A12"
  passengerName: string       // peut être différent du User
  passengerPhone: string
  price: decimal(10,2)
  status: PENDING | CONFIRMED | CANCELLED | REFUNDED
  cancelledAt: Date | null
  cancellationReason: string | null
  createdAt: Date
  updatedAt: Date

  // Relations
  user: ManyToOne → User
  trip: ManyToOne → Trip
  ticket: OneToOne → Ticket
  payment: OneToOne → Payment
  loyaltyTransactions: OneToMany → LoyaltyTransaction
}
```

### 4.3 Ticket (Billet)

```typescript
@Entity('tickets')
@Index(['bookingId'], { unique: true })
@Index(['qrCode'], { unique: true })
class Ticket {
  id: UUID                    // PK
  bookingId: UUID             // FK → Booking (unique)
  qrCode: string              // hash scannable unique
  status: PAID | VALIDATED | EXPIRED
  validatedAt: Date | null    // quand l'agent a scanné
  validatedBy: UUID | null  // FK → User (agent)
  createdAt: Date
  updatedAt: Date

  // Relations
  booking: OneToOne → Booking
}
```

### 4.4 Payment (Paiement)

```typescript
@Entity('payments')
@Index(['bookingId'], { unique: true })
@Index(['transactionRef'], { unique: true })
class Payment {
  id: UUID                    // PK
  bookingId: UUID             // FK → Booking (unique)
  amount: decimal(10,2)
  currency: string            // XAF
  provider: WALLET | MTN_MOMO | ORANGE_MONEY | CASH
  transactionRef: string      // ref externe unique
  status: PENDING | SUCCESS | FAILED | REFUNDED
  paidAt: Date | null
  metadata: jsonb             // réponse brute du provider
  createdAt: Date
  updatedAt: Date

  // Relations
  booking: OneToOne → Booking
}
```

### 4.5 TripStop (Arrêt)

```typescript
@Entity('trip_stops')
@Index(['tripId'])
@Index(['tripId', 'sequence'])
class TripStop {
  id: UUID                    // PK
  tripId: UUID                // FK → Trip
  city: string
  stopName: string            // nom de l'arrêt
  sequence: number            // ordre dans l'itinéraire
  estimatedArrival: Date
  actualArrival: Date | null
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date

  // Relations
  trip: ManyToOne → Trip
}
```

### 4.6 Rating (Notation)

```typescript
@Entity('ratings')
@Index(['userId'])
@Index(['targetType', 'targetId'])
@Unique(['userId', 'targetType', 'targetId']) // 1 note par user/target
class Rating {
  id: UUID                    // PK
  userId: UUID                // FK → User
  targetType: AGENCY | TRIP | DRIVER
  targetId: UUID              // ID de l'entité cible
  score: number               // 1-5
  createdAt: Date
  updatedAt: Date

  // Relations
  user: ManyToOne → User
}
```

### 4.7 Comment (Avis)

```typescript
@Entity('comments')
@Index(['userId'])
@Index(['agencyId'])
@Index(['tripId'])
class Comment {
  id: UUID                    // PK
  userId: UUID                // FK → User
  agencyId: UUID | null       // FK → Agency (si avis sur agence)
  tripId: UUID | null         // FK → Trip (si avis sur voyage)
  content: string             // texte de l'avis
  reply: string | null        // réponse de l'agence
  repliedAt: Date | null
  createdAt: Date
  updatedAt: Date

  // Relations
  user: ManyToOne → User
  agency: ManyToOne → Agency
  trip: ManyToOne → Trip
}
```

### 4.8 LoyaltyTransaction (Fidélité)

```typescript
@Entity('loyalty_transactions')
@Index(['userId'])
@Index(['bookingId'])
class LoyaltyTransaction {
  id: UUID                    // PK
  userId: UUID                // FK → User
  bookingId: UUID | null      // FK → Booking
  points: number              // positif = gagné, négatif = dépensé
  type: EARNED | SPENT | EXPIRED | BONUS
  description: string
  expiresAt: Date | null
  createdAt: Date

  // Relations
  user: ManyToOne → User
  booking: ManyToOne → Booking
}
```

---

## 5. Entités Existantes - Relations à Ajouter

### 5.1 Trip (à enrichir)

Ajouter les relations manquantes :
```
driverId: UUID | null         // FK → Driver (nullable)
driver: ManyToOne → Driver
bookings: OneToMany → Booking
tripStops: OneToMany → TripStop
ratings: OneToMany → Rating (type=TRIP)
comments: OneToMany → Comment
```

### 5.2 Agency (à enrichir)

Ajouter les relations manquantes :
```
drivers: OneToMany → Driver
bookings: OneToMany → Booking (via Trip)
ratings: OneToMany → Rating (type=AGENCY)
comments: OneToMany → Comment
```

### 5.3 User (à enrichir)

Ajouter les relations manquantes :
```
bookings: OneToMany → Booking
ratings: OneToMany → Rating
comments: OneToMany → Comment
loyaltyTransactions: OneToMany → LoyaltyTransaction
```

### 5.4 Vehicle (à enrichir)

Ajouter si manquant :
```
driver: ManyToOne → Driver (nullable, chauffeur assigné)
```

---

## 6. Règles d'Intégrité (Anti-Spaghetti)

### 6.1 Suppressions (CASCADE rules)

| Parent | Enfant | Règle |
|--------|--------|-------|
| Company | Agency | CASCADE |
| Company | AgencyUserRole | CASCADE |
| Agency | Vehicle | CASCADE |
| Agency | Driver | SET NULL sur les trips existants |
| Agency | Trip | RESTRICT (archiver d'abord) |
| Agency | Comment | CASCADE |
| User | Booking | RESTRICT (pas de suppression si bookings) |
| User | AgencyUserRole | CASCADE |
| Trip | Booking | RESTRICT |
| Trip | TripStop | CASCADE |
| Booking | Ticket | CASCADE |
| Booking | Payment | RESTRICT (paiements immuables) |
| Driver | Trip | SET NULL |

### 6.2 Contraintes Uniques

- Un `User` ne peut noter qu'une fois une même entité (`userId` + `targetType` + `targetId`)
- Un `Booking` = un seul `Ticket`
- Un `Booking` = un seul `Payment` (mais plusieurs transactions loyalty)
- `qrCode` dans `Ticket` = unique
- `transactionRef` dans `Payment` = unique
- Un siège sur un `Trip` ne peut être réservé qu'une fois (index composite `tripId` + `seatNumber`)

### 6.3 Contraintes de Valeur

- `Booking.status` ne peut passer de `CONFIRMED` → `CANCELLED` que si `departureTime > now + 2h`
- `Ticket.status` ne peut passer de `PAID` → `VALIDATED` qu'une seule fois
- `Payment` ne peut être supprimé (soft delete uniquement via `status=REFUNDED`)
- `LoyaltyTransaction.points` positif = gain, négatif = dépense

---

## 7. Ordre d'Implémentation (Backend)

### Phase 1 : Fondation (existant ou à compléter)
1. ✅ Company
2. ✅ Agency
3. ✅ User
4. ✅ Role / Permission / AgencyUserRole
5. ✅ Vehicle
6. ✅ Trip
7. ✅ RefreshToken

### Phase 2 : Nouvelles entités (suggéré dans cet ordre)
8. **Driver** → lié à Agency, simple CRUD
9. **TripStop** → lié à Trip, enrichit l'existant
10. **Booking** → cœur métier, lié à User + Trip
11. **Ticket** → lié à Booking, génération QR
12. **Payment** → lié à Booking, mock providers
13. **Rating** → lié à User + (Agency/Trip/Driver)
14. **Comment** → lié à User + Agency
15. **LoyaltyTransaction** → lié à User + Booking

### Phase 3 : Routes API
16. Auth (register/login/refresh/logout/me) ✅ partiel
17. Customer register + login
18. Recherche de trips (avec filtres)
19. Booking (créer, annuler, lister)
20. Ticket (générer QR, valider scan)
21. Payment (initier, vérifier statut)
22. Rating + Comment (créer, lister par agence/trip)
23. Stats agence (dashboard)

---

## 8. Index de Performance

### Recherche de voyages (hot path)
```sql
CREATE INDEX idx_trips_search ON trips (departure_city, arrival_city, departure_time, status);
CREATE INDEX idx_trips_agency ON trips (agency_id, departure_time);
```

### Bookings par user
```sql
CREATE INDEX idx_bookings_user_status ON bookings (user_id, status, created_at DESC);
```

### Tickets par QR
```sql
CREATE INDEX idx_tickets_qr ON tickets (qr_code);
```

### Ratings par target
```sql
CREATE INDEX idx_ratings_target ON ratings (target_type, target_id);
```

---

## 9. Résumé des 18 Entités

| # | Entité | Existant | Rôle |
|---|--------|----------|------|
| 1 | Company | ✅ | Tenant root |
| 2 | Agency | ✅ | Opérationnelle |
| 3 | User | ✅ | Auth + Client |
| 4 | Role | ✅ | RBAC |
| 5 | Permission | ✅ | RBAC |
| 6 | AgencyUserRole | ✅ | Contexte user |
| 7 | Vehicle | ✅ | Transport |
| 8 | Trip | ✅ | Offre voyage |
| 9 | RefreshToken | ✅ | Auth JWT |
| 10 | Driver | ❌ | Conducteur |
| 11 | TripStop | ❌ | Itinéraire |
| 12 | Booking | ❌ | Réservation |
| 13 | Ticket | ❌ | Billet QR |
| 14 | Payment | ❌ | Transaction |
| 15 | Rating | ❌ | Notation |
| 16 | Comment | ❌ | Avis |
| 17 | LoyaltyTransaction | ❌ | Fidélité |
| 18 | Notification | ❌ | Push (optionnel) |

---

## 10. Prochaines Actions Recommandées

1. Créer l'entité **Driver** (simple, liée à Agency)
2. Ajouter `driverId` à **Trip**
3. Créer l'entité **Booking** (cœur métier)
4. Créer l'entité **Ticket** avec génération QR
5. Créer l'entité **Payment** (mock MTN/Orange)
6. Implémenter les endpoints de recherche de trips
7. Implémenter la création de booking + paiement

Tu veux qu'on commence par **Driver** et **Booking** ?
