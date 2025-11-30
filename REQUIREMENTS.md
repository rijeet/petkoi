# Pet Identity Platform - Complete Requirements Document

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Implementation Details](#implementation-details)
6. [Frontend Requirements](#frontend-requirements)
7. [Third-Party Integrations](#third-party-integrations)
8. [Security & Privacy](#security--privacy)
9. [Testing & CI/CD](#testing--cicd)
10. [Deployment](#deployment)
11. [Documentation](#documentation)

---

## Architecture Overview

### 5-Layer Architecture

#### **APP.API** - Presentation Layer
- **Nest.js controllers, routes, guards, DTO validation**
- REST controllers for:
  - Auth, Users, Pets, PetImages, Vaccines, LostPet, Community, Guards, WasteCollectors, Notifications, Maps/GPS, QRScanLog
- **Middleware:**
  - Logging, request-id, rate-limit
- **Guards:**
  - JWT guard, OAuth guard, Roles guard (Owner/Admin)
- **Interceptors:**
  - Transform responses, file size limits

#### **APP.BLL** - Business Logic Layer
- **Services:**
  - PetService, UserService, VaccineService, NotificationService, GPSService, QRService, CommunityService, DirectoryService
- **Mappers:**
  - Entity ↔ DTO, ImageKit response → PetImage entity
- **BaseService:**
  - Generic CRUD helpers, pagination, permission checks

#### **APP.Infrastructure** - Infrastructure Layer
- Prisma client + Neon Postgres config
- ImageKit client wrapper and upload adapter (server-side upload)
- OAuth 2.0 / Google integration helpers
- Notifications: push/FCM or email/SMS adapter (use RabbitMQ or serverless queue for scale)
- Redis cache for geohash radius queries & rate-limiting
- Logging (Pino), metrics (Prometheus optional)

#### **APP.Entity** - Domain Layer
- Prisma models (User, Pet, Vaccine, etc.) — pure domain definitions
- Domain events:
  - PetLostEvent, VaccineAddedEvent, OwnershipTransferredEvent, GPSLocationUpdatedEvent
- BaseEntity: id, createdAt, updatedAt, softDelete

#### **APP.Shared** - Shared Layer
- DTOs for requests/responses, shared validation logic, error classes
- Enums: PetType, Gender, Role, NotificationType
- Utility helpers: geohash utilities, date helpers, pagination model

---

## Project Structure

```
/pet-identity-platform/
  README.md
  .env.example
  package.json (workspace: backend, frontend)
  /infra/           # docker-compose, k8s manifests, migration scripts
  /scripts/         # helper scripts
  /docs/            # generated api docs & architecture diagrams
  /backend/         # Nest.js + Prisma
  /frontend/        # Next.js (app router)
```

### Backend Structure
```
/backend/
  nest-cli.json
  tsconfig.json
  package.json
  prisma/
    schema.prisma
    migrations/
  src/
    main.ts
    app.module.ts
    common/
      guards/
      interceptors/
      filters/
      middleware/
      decorators/
      pipes/
    APP.API/
      auth/
        auth.controller.ts
        auth.module.ts
        google.strategy.ts
      users/
      pets/
      pet-images/
      vaccines/
      lostpet/
      community/
      directory/
      notifications/
      maps/
    APP.BLL/
      services/
        user.service.ts
        pet.service.ts
        vaccine.service.ts
        notification.service.ts
        gps.service.ts
        qr.service.ts
        community.service.ts
      mappings/
        pet.mapper.ts
      core/
        base.service.ts
    APP.Infrastructure/
      prisma/
        prisma.module.ts
        prisma.service.ts
      imagekit/
        imagekit.service.ts
      auth/
        jwt.strategy.ts
        jwt.service.ts
      cache/
        redis.service.ts
      messaging/
        messaging.module.ts
      logging/
        logger.module.ts
    APP.Entity/
      domain/
        events/
      models/ (interfaces used outside Prisma)
    APP.Shared/
      dtos/
      interfaces/
      exceptions/
      enums/
      utils/
  test/
  prismaClientGenerationScript.sh
```

### Frontend Structure
```
/frontend/
  package.json
  next.config.js
  tailwind.config.js
  src/
    app/
      layout.tsx
      page.tsx
      api/ (client restful proxies if needed)
      (pet)/[petId]/page.tsx        # public pet profile
      dashboard/
        settings/
        pets/
        admin/
      community/
    components/
      ui/
        Button.tsx
        Card.tsx
        Modal.tsx
        Map.tsx (Leaflet wrapper)
        ImageUploader.tsx (ImageKit client)
        QRViewer.tsx
      pet/
        PetProfile.tsx
        PetGallery.tsx
        VaccineList.tsx
        LostToggle.tsx
    lib/
      auth/
        nextauth.ts
      api/
        fetcher.ts
      map/
        leafletHelpers.ts
    styles/
      theme.ts
      globals.css
```

---

## Database Schema

### Prisma Schema (backend/prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String    @id @default(uuid())
  email            String    @unique
  name             String?
  role             Role      @default(USER)
  googleId         String?   @unique
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  pets             Pet[]     @relation("OwnerPets")
  ownershipHistory OwnershipHistory[]
  notifications    Notification[]
}

model Pet {
  id           String    @id @default(uuid())
  name         String
  breed        String?
  color        String?
  dateOfBirth  DateTime?
  neutered     Boolean
  gender       Gender
  description  String?
  type         PetType
  qrCodeUrl    String?
  isLost       Boolean   @default(false)
  ownerId      String?
  owner        User?     @relation("OwnerPets", fields: [ownerId], references: [id])
  images       PetImage[]
  vaccines     Vaccine[]
  family       PetFamily[]
  history      OwnershipHistory[]
  gpsHistory   GPSLocationHistory[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model PetImage {
  id         String   @id @default(uuid())
  petId      String
  pet        Pet      @relation(fields: [petId], references: [id])
  url        String
  fileId     String
  tags       String[] @default([])
  uploadedBy String
  metadata   Json?
  createdAt  DateTime @default(now())
}

model Vaccine {
  id            String   @id @default(uuid())
  petId         String
  pet           Pet      @relation(fields: [petId], references: [id])
  name          String
  doseNumber    Int?
  clinic        String?
  injectionDate DateTime
  nextDueDate   DateTime?
  extractedMeta Json?
  createdAt     DateTime @default(now())
}

model PetFamily {
  id      String @id @default(uuid())
  petId   String
  pet     Pet    @relation(fields: [petId], references: [id])
  parentId String?
  relation RelationType
}

model OwnershipHistory {
  id          String   @id @default(uuid())
  petId       String
  pet         Pet      @relation(fields: [petId], references: [id])
  previousOwnerId String?
  newOwnerId   String?
  transferredAt DateTime @default(now())
  note         String?
}

model CommunityPost {
  id         String   @id @default(uuid())
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  title      String
  body       String
  imageUrl   String?
  location   Json?
  tags       String[]
  upvotes    Int      @default(0)
  downvotes  Int      @default(0)
  createdAt  DateTime @default(now())
  comments   CommunityComment[]
}

model CommunityComment {
  id        String @id @default(uuid())
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id])
  authorId  String
  content   String
  parentId  String?
  createdAt DateTime @default(now())
}

model Guard {
  id        String @id @default(uuid())
  name      String
  phone     String
  address   String
  createdAt DateTime @default(now())
}

model WasteCollector {
  id        String @id @default(uuid())
  name      String
  phone     String
  ward      String
  createdAt DateTime @default(now())
}

model Notification {
  id          String @id @default(uuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id])
  type        NotificationType
  payload     Json
  read        Boolean @default(false)
  createdAt   DateTime @default(now())
}

model QRScanLog {
  id        String  @id @default(uuid())
  petId     String?
  pet       Pet?    @relation(fields: [petId], references: [id])
  scannerIp String?
  scannerUserAgent String?
  createdAt DateTime @default(now())
}

model GPSLocationHistory {
  id         String  @id @default(uuid())
  petId      String
  pet        Pet     @relation(fields: [petId], references: [id])
  lat        Float
  lng        Float
  geohash    String
  recordedAt DateTime @default(now())
}

enum PetType { DOG CAT BIRD OTHER }
enum Gender { MALE FEMALE UNKNOWN }
enum Role { USER ADMIN }
enum RelationType { MOTHER FATHER CHILD }
enum NotificationType { LOST_PET_FOUND LOST_ALERT VACCINE_REMINDER OTHER }
```

**Note:** Add indices for geohash and createdAt fields for performance.

---

## API Endpoints

### Auth
- `POST /auth/google` → server-side OAuth callback
- `GET /auth/me` → get current user
- `POST /auth/logout` → logout

### Users
- `GET /users/:id` → get user profile
- `PUT /users/:id` → update user profile

### Pets
- `POST /pets` → create pet (owner only)
- `GET /pets/:id` → public pet profile (shows limited owner info unless lost)
- `PUT /pets/:id` → update pet (owner only)
- `POST /pets/:id/transfer` → initiate ownership transfer
- `POST /pets/:id/verify-qr-scan` → QR scan webhook => log + return public data
- `POST /pets/:id/lost-toggle` → mark lost / found
- `GET /pets?ownerId=&type=` → query & pagination

### Pet Images (ImageKit)
- `POST /pets/:id/images` → accept multipart or base64; upload to ImageKit; save record
- `DELETE /pets/:id/images/:imageId` → delete image

### Vaccines
- `POST /pets/:id/vaccines` → create vaccine (uploads image, runs OCR extraction)
- `GET /pets/:id/vaccines` → get vaccine list

### GPS
- `POST /pets/:id/gps` → push current {lat, lng}; save geohash; publish event
- `GET /pets/:id/gps/history` → get GPS history

### Community
- `POST /community/posts` → create post
- `GET /community/posts` → list posts
- `POST /community/posts/:id/comments` → add comment
- `POST /community/posts/:id/upvote` → upvote post

### Directory
- `POST /directory/guards` → add guard (admin)
- `GET /directory/guards/nearby?lat=&lng=&radiusKm=` → find nearby guards
- `POST /directory/wasteCollectors` → add waste collector (admin)

### Notifications
- `GET /notifications` → get user notifications
- `POST /notifications/mark-read` → mark notification as read

---

## Implementation Details

### DTOs + Validation

**Example: CreatePetDto**
```typescript
export class CreatePetDto {
  @IsString() name: string;
  @IsEnum(PetType) type: PetType;
  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsBoolean() neutered: boolean;
  @IsEnum(Gender) gender: Gender;
  @IsOptional() @IsString() description?: string;
}
```

Use `class-validator` + `class-transformer` in Nest.js.

### Controller → Service Pattern

**Example: pets.controller.ts**
```typescript
@Controller('pets')
export class PetsController {
  constructor(private readonly petService: PetService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@User() user: UserEntity, @Body() dto: CreatePetDto) {
    return this.petService.create(user.id, dto);
  }

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    return this.petService.getPublicProfile(id);
  }

  @Post(':id/lost-toggle')
  @UseGuards(JwtAuthGuard)
  toggleLost(@User() user: UserEntity, @Param('id') id: string, @Body() body: {isLost: boolean}) {
    return this.petService.setLostStatus(user.id, id, body.isLost);
  }
}
```

**Example: pet.service.ts**
```typescript
@Injectable()
export class PetService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gpsService: GPSService,
    private qrService: QRService,
  ) {}

  async create(ownerId: string, dto: CreatePetDto) {
    const pet = await this.prisma.pet.create({ data: { ...dto, ownerId }});
    const qrUrl = await this.qrService.generateForPet(pet);
    await this.prisma.pet.update({ where: { id: pet.id }, data: { qrCodeUrl: qrUrl }});
    return this.getPublicProfile(pet.id);
  }

  async setLostStatus(userId: string, petId: string, isLost: boolean) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId }});
    if (!pet || pet.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.pet.update({ where: { id: petId }, data: { isLost }});
    if (isLost) {
      await this.notificationService.broadcastLostPet(petId);
    }
    return { success: true };
  }

  async getPublicProfile(petId: string) {
    return this.prisma.pet.findUnique({
      where: { id: petId },
      include: { images: true, vaccines: true, owner: { select: { id: true, name: true }}}
    });
  }
}
```

### ImageKit Upload Service (Backend)

**Server-side only** - Accept multipart or base64

Use ImageKit SDK (`npm imagekit`)

Set folder `/pets/{petId}/`, tags `["pet", petId]`, metadata `{petId, ownerId, uploadedBy}`

**Example:**
```typescript
async uploadPetImage(petId: string, fileBuffer: Buffer, filename: string, ownerId: string) {
  const upload = await this.imageKit.upload({
    file: fileBuffer.toString('base64'),
    fileName: filename,
    folder: `/pets/${petId}/`,
    tags: ['pet', petId],
    customMetadata: { petId, ownerId, uploadedBy: 'user' }
  });
  return {
    url: upload.url,
    fileId: upload.fileId
  };
}
```

**Security:** Keep private key on server only. Validate image size/format (max 6MB, image types only).

**Limits:** Maximum 5 images per pet.

### Vaccine OCR/Computer Vision Approach

**Two-tier approach:**

1. **Fast path:** Use OCR/vision pipeline (OpenAI Vision + heuristics OR AWS Textract / Google Vision) to extract text, then rule-based parser to identify:
   - Vaccine name
   - Dose number
   - Clinic
   - Dates (injectionDate, nextDueDate)

2. **ML path:** Fine-tune classifier/NER model (or prompt-engineer with LLM) to extract structured vaccine fields and support multiple sticker extraction in one image.

**Flow:**
1. Upload vaccine image via frontend
2. Backend saves image via ImageKit and records PetImage + Vaccine entity
3. Backend calls OCR pipeline:
   - Preprocess: crop, threshold, object-detect stickers (detect rectangles/labels)
   - OCR each sticker
   - For each OCR block, run transformer prompt to extract `{vaccineName, doseNumber, clinic, injectionDate, nextDueDate}`
4. Save results into Vaccine record with `extractedMeta` JSON and `nextDueDate`
5. Schedule reminder: push to NotificationService and create Notification entry with nextDueDate (or schedule via queue)

**Implementation notes:**
- Start with Google Vision OCR (cheap) and robust regex for dates
- If quality low, plug OpenAI Vision or custom fine-tuned OCR pipeline
- For multi-sticker images: run object detection (contour clustering) to split then OCR each segment
- Provide modular pipeline service `vaccineOcrService.parseImage(imageUrl)` that returns array of extracted vaccine objects
- Fallback to human review if confidence low

### Lost Pet Logic, Geohash, Notification

**When pet toggles `isLost = true`:**
1. Get last known GPS coordinate from GPSLocationHistory (most recent)
2. Compute geohash of that location (precision ~6–7 for 1–2 km). Use `ngeohash` npm lib
3. Find nearby users by scanning GPSHistory or user opt-in location: query pets/users with geohashes in neighbors (use Redis for fast neighbour lookups)

**NotificationService:**
- Create Notification entries for each nearby user
- Optionally send push via FCM/web push + email

**QR scan public page:**
- If `isLost`: show red banner, owner contact (only if allowed), "Send location" button
- When finder clicks "Send location":
  - Use browser geolocation to send `{lat, lng, note}` POST `/pets/:id/found`
  - Pings owner via NotificationService + includes coordinates

**Edge considerations:**
- Privacy: owner contact only visible when pet is lost OR user chooses to show contact in public profile settings
- Abuse: rate-limit QR scans & report system

### GPS Simulation & Storage

- Clients (owner app or simulation UI) periodically POST to `/pets/:id/gps` with `lat/lng`
- Service computes `geohash = encode(lat, lng, precision)`
- Save record in GPSLocationHistory
- Update Pet.lastKnownLat, Pet.lastKnownLng (if fields added) for quick retrieval
- For simulation: admin tool that iterates coordinates and pushes to endpoint

### QR Code Generation & Scanning

- On pet creation, server generates QR (SVG or PNG) pointing to `https://app.example.com/pet/{petId}/public`
- Use `qrcode` npm library to generate
- Store `qrCodeUrl` in Pet record (maybe store static image in ImageKit)
- QR scanned by public → open pet public page; server logs scan in QRScanLog

---

## Frontend Requirements

### Map & Leaflet Integration

- Create Map component wrapper that loads Leaflet only on client (dynamic import)
- Custom icons: preload images (dog, cat, bird, lost-glow)
- Use clustering for many markers (Leaflet.markercluster)
- Show last-known location for pets and owner markers
- Lost pets: use pulse/glow CSS + bigger marker
- `leafletHelpers.ts` - helper to convert pets → markers, create custom icons, handle popup actions (e.g., open pet profile, send found location)

### Frontend Auth (NextAuth.js + Google OAuth)

- NextAuth with Google provider
- Persist sessions using JWT or NextAuth adapter for Prisma (store users)
- Roles: Add role to user session token (`user.role`)
- Protect pages: useSession, server component serverSideCheck, or API guard

### Frontend UI & Theme

- Tailwind CSS with CSS variables for pink/orange theme
- Provide theme switch (persist preference in user profile/localStorage)
- Mobile-first component library; build small design system: Card, Badge, Input, Map, ImageGallery, VaccineCard

**Colors:**
- Light: card bg `#ffe6f0` (pink), text `#1a1a1a`
- Dark: bg `#111`, text accents `#ff7aa2` and `#fff`

**Accessibility:**
- Alt text for images
- Keyboard navigable
- Sufficient contrast

### Frontend Pages Required

1. **Public Pet Profile** (`(pet)/[petId]/page.tsx`) - QR landing page
2. **Owner Dashboard** (`dashboard/pets/`) - list of pets, upload images, mark lost
3. **Pet Profile Page** (`dashboard/pets/[petId]`) - gallery, vaccine list, family tree, transfer ownership
4. **Community Pages** (`community/`) - create posts, comments, upvote
5. **Map View** - with Leaflet and custom markers
6. **Admin Dashboard** (`dashboard/admin/`) - moderation & directory management

---

## Third-Party Integrations

### Environment Variables (.env.example)

```env
DATABASE_URL=postgresql://...
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/3q7x0peae
JWT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REDIS_URL=redis://...
FCM_SERVER_KEY=...
SENDGRID_API_KEY=...
```

### ImageKit
- Server-side upload only
- Private key never exposed to frontend
- Folder structure: `/pets/{petId}/`
- Tags: `["pet", petId]`
- Metadata: `{petId, ownerId, uploadedBy: 'user'}`

### OCR Providers
- Primary: Google Vision API
- Fallback: OpenAI Vision API
- Modular design to swap providers

### Notifications
- Push: FCM (Firebase Cloud Messaging)
- Email: SendGrid
- Queue: RabbitMQ or serverless queue for scale

### Cache
- Redis for geohash radius queries & rate-limiting
- Use Upstash or managed Redis

---

## Security & Privacy

### Security Requirements

1. **Do not expose ImageKit private key on frontend**
2. **Owner contact only shown when:**
   - `pet.isLost = true` OR
   - Owner opt-in to show contact in public profile settings
3. **Rate-limit:**
   - QR scans
   - All endpoints (prevent spam/abuse)
4. **Sanitize OCR outputs** (prevent XSS/injection)
5. **Role-based guard for admin-only actions**
6. **Validate file types & sizes server-side** (e.g., <= 6MB, image types only)
7. **CORS configuration** - restrict to frontend domain
8. **CSP (Content Security Policy)** headers

### Privacy Considerations

- GPS location data should be opt-in
- Owner contact information protected
- QR scan logs should not expose sensitive data
- Notification preferences per user

---

## Testing & CI/CD

### Testing Requirements

**Unit Tests:**
- Jest for services, mappers
- Minimum 60% coverage for backend services

**Integration Tests:**
- Supertest for controller endpoints against test DB

**E2E Tests:**
- Playwright for frontend
- Critical flows:
  - QR scan
  - Lost workflow
  - Upload
  - Auth flow

### CI/CD Pipeline (GitHub Actions)

1. Lint (ESLint, Prettier)
2. Build backend
3. Run unit tests
4. Build frontend
5. Run E2E tests
6. On main branch: build & push Docker images

---

## Deployment

### Recommended Services

- **Frontend:** Vercel (Next.js app router)
- **Backend:** Fly / Render / Heroku / AWS Fargate
- **Database:** Neon Postgres
- **Images:** ImageKit (already configured)
- **Caching/Redis:** Upstash or managed Redis
- **Notifications:** FCM for push; SendGrid for email

### Deployment Requirements

- Expose HTTPS endpoints
- Secure environment variables
- Database migrations run automatically
- Health check endpoints
- Monitoring and logging setup

---

## Documentation

### README.md Should Include

1. **Project summary**
2. **Architecture overview** (diagram + layer mapping)
3. **Quick start:**
   - Environment setup
   - Install dependencies
   - Run backend
   - Run frontend
4. **Migration workflow** (Prisma migrate dev)
5. **How to run tests**
6. **How to generate QR codes & where they live**
7. **How ImageKit uploads are done and metadata format**
8. **How vaccine OCR works and how to replace OCR engine**
9. **Deployment notes** (Vercel for frontend, Neon for DB, Fly/Vercel/Render for backend)
10. **Security notes** (env secrets, rate limits, CORS, CSP)
11. **API documentation summary & Postman/OpenAPI location**

### Additional Documentation

- Generate OpenAPI spec via NestJS Swagger module
- Architecture diagram (ASCII or image)
- API documentation (Swagger/OpenAPI)
- Deployment guide
- Contributing guidelines

---

## Acceptance Tests / Demo Flows

### Critical User Flows

1. **Create user via Google OAuth** → **create a pet** → **upload 3 images** → **QR generated and accessible**
2. **Mark pet as lost** → **ensure notifications created for users near lastGPS** → **public QR page shows lost banner and contact button**
3. **Upload a vaccine image with multiple stickers** → **OCR extracts multiple vaccine records and schedules reminders**
4. **Map page shows pets with appropriate icons and lost pets highlighted**

---

## Deliverables Checklist

- [ ] Git repo with `backend/` and `frontend/` folders
- [ ] README with all sections
- [ ] Migration scripts
- [ ] Seed data script
- [ ] Architecture.md explaining where each major feature lives in the 5-layer architecture
- [ ] OpenAPI/Swagger documentation
- [ ] Unit tests (60%+ coverage)
- [ ] E2E tests for critical flows
- [ ] CI/CD pipeline
- [ ] Deployment guides

---

## Priority / MVP

### Core Flows (Priority 1)
- [ ] Auth (Google OAuth)
- [ ] Pet CRUD
- [ ] Image upload & QR generation
- [ ] Lost pet notifications
- [ ] Map with last-known locations
- [ ] Vaccine OCR basic

### Secondary Features (Priority 2)
- [ ] Community features
- [ ] Directory (guards, waste collectors)
- [ ] Ownership transfer history
- [ ] Admin moderation

---

## Technical Constraints

1. **TypeScript strict mode** on both backend and frontend
2. **All network secrets stored in env variables** - never expose private keys to frontend
3. **Image uploads limited to 5 per pet**
4. **Validate file types & sizes server-side** (e.g., <= 6MB)
5. **Tests: at least 60% coverage for backend services** - basic E2E flows for frontend
6. **Generate OpenAPI spec from Nest (Swagger)** and publish in `/docs/api`
7. **Accessibility:** alt text for images; ARIA labels on interactive UI elements; keyboard navigation

---

## Implementation Hints

1. Use Prisma as single source of truth for domain models
2. Create a `BaseService<T>` with common CRUD methods to extend
3. For geohash radius: use `ngeohash.encode(lat,lng,precision)` precision 6–7 then query neighbors
4. Use Redis to index current pet locations for quicker geospatial neighbour queries
5. ImageKit: use server-side imagekit SDK; store returned fileId in DB; optionally mirror CDN URL
6. For OCR: implement a modular pipeline service `vaccineOcrService.parseImage(imageUrl)` that returns an array of extracted vaccine objects, fallback to human review if confidence low
7. For notifications: create a pluggable `NotificationTransport` interface; provide `EmailTransport` & `PushTransport` sample implementations
8. If exact OCR model cannot be implemented: provide an integration stub and a well-documented connector for replacing with any OCR service; include a small mock OCR engine for tests

---

## End of Requirements Document

This document captures all requirements for the Pet Identity Platform. Use this as the authoritative reference for implementation.

