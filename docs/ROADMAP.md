# GEGO - Roadmap & Architecture Complète

## 1. Vision Produit

GEGO est une plateforme de billetterie digitale pour le transport interurbain en Afrique. Elle connecte :
- **Voyageurs** → recherche, réservation, paiement, billet QR
- **Agences** → planning, gestion des véhicules, validation des billets, stats
- **Chauffeurs** → suivi GPS, liste des passagers
- **Compagnies** → multi-agences, tarification, reporting

**Objectif MVP :** Un voyageur peut chercher un trajet, payer et recevoir un billet QR en moins de 3 minutes.

---

## 2. Architecture Recommandée

### 2.1 Decision : Monolithe Modulaire (pas microservices)

**Pourquoi pas les microservices maintenant :**
- Équipe petite (1-3 devs), microservices = complexité inutile
- Latence réseau inacceptable en Afrique (3G/4G instable)
- Transactions booking/paiement/ticket doivent être ACID (TypeORM + PostgreSQL)
- Déploiement plus simple, debugging plus facile
- Migration possible plus tard si > 100 000 bookings/jour

**Architecture cible : Monolithe modulaire NestJS**

```
┌─────────────────────────────────────────────────────────────┐
│                    GEGO API (NestJS)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │  Trip   │ │ Booking │ │ Payment │           │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  User   │ │ Vehicle │ │ Ticket  │ │  Admin  │           │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                    PostgreSQL (RDS)                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │  Mobile │          │Backoffice│          │  Staff  │
   │ (Expo)  │          │(Angular) │          │ (Expo)  │
   └─────────┘          └─────────┘          └─────────┘
```

### 2.2 Stack Technique Complète

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Backend** | NestJS 11 + TypeScript | Architecture modulaire, enterprise-grade |
| **ORM** | TypeORM | Migrations, relations complexes, PostgreSQL natif |
| **Base de données** | PostgreSQL 16 | ACID, JSONB, recherche textuelle, géospatiale |
| **Cache** | Redis | Sessions, rate limiting, cache des trips populaires |
| **Queue** | BullMQ (Redis) | Paiements async, notifications, génération de rapports |
| **Storage** | AWS S3 / MinIO | Photos de profil, QR codes, documents agences |
| **Auth** | JWT + Refresh Tokens | Stateless, mobile-friendly |
| **Payments** | Mock → PayTech / Stripe | Mock d'abord, intégration réelle en Phase 3 |
| **Notifications** | Firebase Cloud Messaging | Push notifications (booking confirmé, rappel voyage) |
| **Email** | Resend / SendGrid | Confirmation de réservation, récupération de mot de passe |
| **SMS** | Twilio / Africa's Talking | OTP, notification de paiement |
| **Monitoring** | Sentry + Grafana | Erreurs en temps réel, métriques API |
| **Logs** | Winston + Loki | Logs structurés, recherche facile |
| **Infra** | Docker + Docker Compose | Dev local identique à la prod |
| **Cloud** | AWS / Scaleway / Hetzner | VPS pour démarrer, ECS/EKS pour scale |
| **CI/CD** | GitHub Actions | Tests auto, build, déploiement |
| **API Gateway** | Nginx / Traefik | Rate limiting, SSL, load balancing |

---

## 3. Roadmap Détaillée

### Phase 1 : Fondation (Semaines 1-4)
**Objectif :** L'API est fonctionnelle, le mobile peut s'authentifier et chercher des voyages.

- [x] Architecture NestJS modulaire
- [x] Entités de base (Company, Agency, User, Role, Vehicle, Trip)
- [x] Auth JWT (register, login, refresh, logout, me)
- [x] Guards multi-tenant (X-Company-Id, X-Agency-Id)
- [x] RBAC (roles et permissions)
- [x] Entités Booking + Ticket + Payment (mock)
- [x] Endpoint recherche de voyages (`GET /trips/search`)
- [x] Endpoint création de réservation (`POST /bookings`)
- [ ] Endpoint validation QR (`POST /tickets/validate`)
- [ ] Mobile : connexion API (Axios + React Query)
- [ ] Mobile : écran recherche de voyages
- [ ] Mobile : écran détail voyage
- [ ] Docker + docker-compose complet

**Livrable :** `docker-compose up` lance tout le stack. Le mobile mock les données réelles.

---

### Phase 2 : Customer Mobile (Semaines 5-8)
**Objectif :** Le voyageur peut réserver et payer depuis son téléphone.

- [ ] Mobile : écran réservation (sélection des sièges)
- [ ] Mobile : écran paiement (mock MTN/Orange)
- [ ] Mobile : écran billet QR
- [ ] Mobile : écran "Mes billets" (connecté à l'API)
- [ ] Mobile : notifications push (Firebase)
- [ ] API : endpoint "Mes bookings" (`GET /bookings/me`)
- [ ] API : endpoint détail booking (`GET /bookings/:id`)
- [ ] API : endpoint annulation (`POST /bookings/:id/cancel`)
- [ ] API : webhook paiement (simuler confirmation)
- [ ] Tests E2E mobile (Maestro ou Detox)

**Livrable :** Un testeur peut faire Douala → Yaoundé en 3 minutes.

---

### Phase 3 : Backoffice Angular (Semaines 9-12)
**Objectif :** L'agence gère ses voyages, véhicules, chauffeurs et voit ses stats.

- [ ] Angular : login + guards
- [ ] Angular : dashboard (stats du jour)
- [ ] Angular : CRUD voyages (calendrier)
- [ ] Angular : CRUD véhicules
- [ ] Angular : CRUD chauffeurs
- [ ] Angular : gestion des tarifs (PricingRule)
- [ ] Angular : liste des réservations
- [ ] Angular : validation manuelle de billets (scan QR)
- [ ] Angular : rapports (PDF export)
- [ ] API : endpoints admin (stats, rapports)

**Livrable :** Une agence peut gérer 100% de son activité depuis le backoffice.

---

### Phase 4 : Staff Mobile (Semaines 13-14)
**Objectif :** L'agent à l'embarquement scanne les QR codes.

- [ ] Expo app staff (séparée ou même app avec switch)
- [ ] Login staff (AGENCY_MANAGER, TICKET_AGENT)
- [ ] Écran scan QR (expo-camera)
- [ ] Liste des passagers du voyage du jour
- [ ] Suivi en temps réel (WebSocket ou SSE)
- [ ] API : endpoint validation QR sécurisé
- [ ] API : endpoint liste passagers par trip

**Livrable :** Un agent scanne 50 billets en moins de 5 minutes.

---

### Phase 5 : Production & Paiement Réel (Semaines 15-16)
**Objectif :** Vrais paiements MTN/Orange, monitoring, sécurité.

- [ ] Intégration MTN MoMo API (sandbox puis prod)
- [ ] Intégration Orange Money API
- [ ] Redis pour sessions et cache
- [ ] Rate limiting (throttle les endpoints publics)
- [ ] Sentry pour erreurs
- [ ] SSL + domaine personnalisé
- [ ] Backup PostgreSQL automatique
- [ ] Documentation API (Swagger déjà présent)
- [ ] Tests de charge (k6 ou Artillery)

**Livrable :** Première transaction réelle en production.

---

### Phase 6 : Scale & Analytics (Semaines 17-20)
**Objectif :** Plateforme stable avec insights business.

- [ ] CDN pour les assets (CloudFront)
- [ ] Read replicas PostgreSQL (pour les recherches)
- [ ] Elasticsearch pour recherche de voyages avancée
- [ ] Analytics (Google Analytics / Mixpanel / PostHog)
- [ ] Système de promo codes
- [ ] Fidélité (points par voyage)
- [ ] Référencement (parrainage)
- [ ] App iOS/Android stores (build EAS)

**Livrable :** 1 000+ utilisateurs actifs.

---

## 4. Attentes Précises d'un Projet de Billetterie

### 4.1 Côté Voyageur
| Attente | Implémentation |
|---------|----------------|
| Recherche rapide (< 2s) | Index PostgreSQL + cache Redis |
| Paiement sécurisé | HTTPS + tokenization + webhook |
| Billet fiable | QR unique + validation serveur |
| Notification proactive | Push + SMS 2h avant départ |
| Annulation facile | Bouton annuler + remboursement auto |
| Historique clair | Onglets Payés / Validés / Annulés |

### 4.2 Côté Agence
| Attente | Impléplication |
|---------|----------------|
| Planning visuel | Calendrier Angular (fullcalendar) |
| Occupation en temps réel | WebSocket ou polling |
| Tarification flexible | PricingRule par trajet + multiplicateurs |
| Validation rapide | Scan QR + bip sonore |
| Reporting | Export PDF + dashboard |
| Multi-caissier | Chaque agent a son compte + permissions |

### 4.3 Côté Compagnie
| Attente | Implémentation |
|---------|----------------|
| Multi-agences | Tenant scoping (companyId) |
| Consolidation | Dashboard global toutes agences |
| Tarification centralisée | PricingRule héritables |
| Audit | Logs immuables des transactions |

---

## 5. Architecture Technique Détaillée

### 5.1 Flux de Données : Recherche → Réservation → Paiement

```
1. Recherche
   Mobile → GET /api/v1/trips/search?departureCity=Douala&arrivalCity=Yaoundé
   API → PostgreSQL (index + cache Redis 5min)
   Response → [{ id, departureTime, price, availableSeats, agency }]

2. Réservation
   Mobile → POST /api/v1/bookings { tripId, seats: [...] }
   API → Transaction SQL :
     - Vérifier places disponibles (SELECT FOR UPDATE)
     - Créer Booking (PENDING)
     - Créer BookingSeat
     - Générer Ticket QR
     - Créer Payment (PENDING)
     - Décrémenter places (UPDATE Trip)
   Response → { bookingId, tickets: [{ qrCode }], payment: { transactionRef } }

3. Paiement
   Mobile → POST /api/v1/payments/initiate { provider: MTN_MOMO, phone }
   API → Appel API MTN MoMo (async)
   API → Webhook MTN → UPDATE Payment SUCCESS
   API → UPDATE Booking CONFIRMED
   API → Notification FCM → "Votre billet est confirmé"
   API → Email Resend → Billet PDF

4. Validation (jour du voyage)
   Staff → Scan QR avec expo-camera
   Staff → POST /api/v1/tickets/validate { qrCode }
   API → Vérifier QR (hash + non-expiré)
   API → UPDATE Ticket VALIDATED
   API → UPDATE BookingSeat status
   Staff → Bip vert + affiche nom passager
```

### 5.2 Données en Temps Réel & GPS

**Enjeux critiques :**
- Un voyageur doit voir les **places disponibles en temps réel** (pas de sur-réservation)
- Un agent doit voir les **passagers validés** instantanément (pas de double validation)
- Un chauffeur doit être **localisé en temps réel** (retard estimé)

**Architecture recommandée :**

```
Client (Expo) ←── WebSocket ──→ NestJS Gateway ──→ Redis Pub/Sub
                                      │
                                      ▼
                              PostgreSQL (état persistant)
```

| Cas d'usage | Technologie | Justification |
|-------------|-------------|---------------|
| **Occupation sièges** | SSE (Server-Sent Events) | Unidirectionnel, léger, fonctionne sur 3G |
| **Validation QR** | WebSocket | Bidirectionnel, confirmation instantanée |
| **Position bus** | WebSocket + PostgreSQL (PostGIS) | Stream GPS toutes les 10s, stockage historique |
| **Notifications** | Firebase Cloud Messaging | Push quand l'app est fermée |
| **Compteur temps réel** | Redis counter + SSE | `INCR/DECR` atomique sur les places |

**Pourquoi pas seulement du polling ?**
- Polling toutes les 5s = 720 requêtes/min par utilisateur = explosion du serveur
- SSE = une connexion persistante, push depuis le serveur, 10x moins de charge

**Pourquoi Redis ?**
- `INCR trip:123:seats` pour compter les places (atomique, < 1ms)
- `PUBLISH booking:123 "confirmed"` pour notifier tous les clients
- `SET driver:456:location "{lat, lng}"` pour le GPS (TTL 60s)

**Schéma GPS simplifié :**
```typescript
@Entity('driver_locations')
@Index(['driverId'])
@Index(['tripId'])
class DriverLocation {
  id: UUID
  driverId: UUID
  tripId: UUID
  latitude: decimal
  longitude: decimal
  speed: number          // km/h
  heading: number        // degrés
  recordedAt: Date       // timestamp GPS
  createdAt: Date
}
```
- Enregistrement toutes les **10 secondes** quand le bus roule
- TTL Redis de **60 secondes** (si pas de signal, le bus est considéré arrêté)
- Client mobile reçoit les positions via SSE sur `/events/trip/:id/location`

### 5.3 Schéma de Base de Données (18 entités)

Déjà documenté dans `DATA_MODEL.md`. Points clés :
- **Transactions** : `booking + seats + tickets + payment` dans une transaction SQL
- **Index** : `trips(departureCity, arrivalCity, departureTime)` pour la recherche
- **Contraintes** : `booking_seats(bookingId, seatNumber)` UNIQUE pour éviter double réservation
- **Soft delete** : Pas de `DELETE` sur `Payment`, `Ticket`, `Booking`. On utilise `status`.

---

## 6. Infrastructure & DevOps

### 6.1 Environnements

| Environnement | URL | Usage |
|---------------|-----|-------|
| Local | `localhost:3000` | Développement avec docker-compose |
| Staging | `staging.gego.com` | Tests internes, démo clients |
| Production | `api.gego.com` | Production réelle |

### 6.2 Docker Compose (Local)

```yaml
version: '3.8'
services:
  api:
    build: ./gego-api-v1
    ports: ["3000:3000"]
    env_file: .env
  postgres:
    image: postgres:16
    volumes: ["postgres_data:/var/lib/postgresql/data"]
  redis:
    image: redis:7-alpine
  minio:
    image: minio/minio
    # S3 local pour les fichiers
```

### 6.3 CI/CD Pipeline (GitHub Actions)

```
Push sur main
  ├── Tests unitaires (Jest)
  ├── Tests d'intégration (Supertest)
  ├── Build Docker image
  ├── Push sur ECR (AWS)
  ├── Déploiement Staging
  ├── Tests E2E (Cypress/Maestro)
  └── Déploiement Production (manuel)
```

---

## 7. Sécurité

### 7.1 Authentification
- JWT access token (15 min)
- Refresh token rotatif (7 jours, stocké en hash)
- Password hashing avec bcrypt (cost 12)
- Rate limiting : 5 req/min sur login, 100 req/min sur search

### 7.2 Données
- HTTPS partout (Let's Encrypt)
- Headers de sécurité (Helmet)
- CORS restrictif (origines mobiles + backoffice)
- Pas de données sensibles dans les logs
- Backup chiffré PostgreSQL (daily)

### 7.3 Paiement
- PCI-DSS : on ne stocke JAMAIS les numéros de carte
- Webhook signatures vérifiées (HMAC)
- Idempotency keys sur les paiements

---

## 8. Monitoring & Alertes

| Métrique | Outil | Seuil d'alerte |
|----------|-------|----------------|
| Erreurs 500 | Sentry | > 5/min |
| Latence API p95 | Grafana | > 500ms |
| CPU/RAM | CloudWatch | > 80% |
| DB connections | Grafana | > 80% du pool |
| Paiements échoués | Custom dashboard | > 5% |
| Places disponibles négatives | Custom alert | IMMÉDIAT |

---

## 9. Prochaines Actions Immédiates (cette semaine)

1. **Terminer les endpoints critiques API**
   - [ ] `GET /bookings/me` → liste des billets du customer
   - [ ] `POST /tickets/validate` → scan QR par l'agent
   - [ ] `POST /payments/initiate` → démarrer un paiement mock

2. **Connecter le mobile à l'API**
   - [ ] Configurer Axios avec baseURL
   - [ ] Hook React Query pour recherche de voyages
   - [ ] Hook React Query pour création de booking

3. **Dockeriser le backend**
   - [ ] `Dockerfile` pour l'API
   - [ ] `docker-compose.yml` complet (API + PostgreSQL + Redis)

**Tu veux qu'on attaque quoi en priorité :**
- **A)** Les 3 endpoints manquants (`/bookings/me`, `/tickets/validate`, `/payments/initiate`)
- **B)** Connecter le mobile à l'API (Axios + React Query)
- **C)** Dockeriser tout le stack
