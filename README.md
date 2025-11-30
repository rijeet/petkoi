# Pet Identity Platform

A comprehensive platform for tracking and managing pet identity, health records, and location using QR codes, GPS tracking, and community features.

## 🚀 Features

- **Pet Management**: Create and manage pet profiles with detailed information
- **QR Code Identity**: Generate unique QR codes for each pet
- **Image Upload**: Upload and manage pet images using ImageKit
- **GPS Tracking**: Track pet locations with geohash-based storage
- **Lost Pet Alerts**: Broadcast notifications when pets are marked as lost
- **Community Posts**: Share posts and comments with the pet community
- **Directory Services**: Access guards and waste collector information
- **Vaccine Records**: Track vaccination history (OCR extraction coming soon)

## 📁 Project Structure

This is a monorepo containing:

- **backend/** - Nest.js REST API with Prisma ORM
- **frontend/** - Next.js App Router with TypeScript

## 🛠 Tech Stack

### Backend
- Nest.js 11.x
- Prisma ORM with PostgreSQL (Neon)
- TypeScript (strict mode)
- ImageKit for image storage
- Redis for caching (optional)
- JWT + Google OAuth authentication
- Swagger/OpenAPI documentation
- Jest for testing

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS
- Leaflet.js for maps
- NextAuth.js for authentication

## 🏗 Architecture

The backend follows a 5-layer architecture:

1. **APP.API** - Presentation Layer (Controllers, Guards, DTOs)
2. **APP.BLL** - Business Logic Layer (Services, Mappers)
3. **APP.Infrastructure** - Infrastructure Layer (Prisma, ImageKit, Redis, Auth)
4. **APP.Entity** - Domain Layer (Prisma Models, Domain Events)
5. **APP.Shared** - Shared Layer (DTOs, Enums, Utilities)

See `REQUIREMENTS.md` for detailed architecture documentation.

## 🚦 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (or [Neon](https://neon.tech) account)
- Redis (optional, for caching)
- ImageKit account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pet-identity-platform
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Set up environment variables**

   Create `.env` files in both backend and frontend directories:

   **backend/.env**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pet_platform"
   JWT_SECRET="your-jwt-secret-key"
   IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
   IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
   IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
   FRONTEND_URL="http://localhost:3000"
   PORT=3001
   ```

   **frontend/.env.local**
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up database**

   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the development servers**

   ```bash
   # Backend (from backend directory)
   npm run dev  # Runs on http://localhost:3001

   # Frontend (from frontend directory)
   npm run dev  # Runs on http://localhost:3000
   ```

## 📜 Available Scripts

### Backend

- `npm run dev` - Start Nest.js in watch mode
- `npm run build` - Build for production
- `npm run start:prod` - Run production build
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 API Documentation

Once the backend is running, Swagger documentation is available at:

**http://localhost:3001/docs/api**

The Swagger UI provides:
- Interactive API testing
- Request/response schemas
- Authentication setup
- All available endpoints

### Key Endpoints

- `GET /health` - Health check
- `POST /auth/google` - Google OAuth authentication
- `GET /pets` - List user's pets
- `POST /pets/:id/images` - Upload pet image
- `POST /pets/:id/gps` - Record GPS location
- `GET /community/posts` - List community posts
- `GET /directory/guards` - List guards

See Swagger documentation for complete API reference.

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run unit tests
npm run test

# Run tests with coverage (target: 60%)
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The project aims for minimum 60% code coverage for backend services. Coverage reports are generated in `backend/coverage/`.

### Running Tests in CI

Tests run automatically on push/PR via GitHub Actions. See `.github/workflows/ci.yml` for configuration.

## 🗄 Database Migrations

### Create a new migration

```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Apply migrations in production

```bash
cd backend
npx prisma migrate deploy
```

### Generate Prisma Client

After schema changes:

```bash
cd backend
npx prisma generate
```

### Prisma Studio

View and edit database data:

```bash
cd backend
npm run prisma:studio
```

## 📸 ImageKit Integration

### How Image Uploads Work

1. **Server-side only**: ImageKit private key is never exposed to frontend
2. **Upload flow**:
   - Frontend sends image file to backend
   - Backend validates file (size, type)
   - Backend uploads to ImageKit with metadata
   - Backend saves record in database
3. **Folder structure**: `/pets/{petId}/`
4. **Tags**: `["pet", petId]`
5. **Metadata**: `{petId, ownerId, uploadedBy: 'user'}`

### Image Limits

- Maximum 5 images per pet
- Maximum file size: 6MB
- Allowed types: JPEG, PNG, WebP, GIF

### Example Upload

```typescript
// Frontend
const formData = new FormData();
formData.append('image', file);
await apiClient.uploadPetImage(petId, file);
```

## 🔲 QR Code Generation

### How QR Codes Work

1. Each pet gets a unique QR code URL
2. URL format: `{FRONTEND_URL}/pet/{petId}/public`
3. QR codes are generated using `qrcode` library
4. QR codes link to public pet profile page

### Generating QR Codes

QR codes are automatically generated when a pet is created. To regenerate:

```typescript
// Backend service
const qrCodeUrl = qrService.getQRUrl(petId);
```

### QR Code Display

Frontend uses `qrcode.react` to display QR codes:

```tsx
import { QRCodeSVG } from 'qrcode.react';
<QRCodeSVG value={pet.qrCodeUrl} size={200} />
```

## 🗺 GPS Tracking & Geohash

### How GPS Tracking Works

1. **Location Recording**: Pet owners record GPS coordinates
2. **Geohash Generation**: Coordinates encoded to geohash (precision 7 = ~150m)
3. **Storage**: Location history stored with geohash for fast queries
4. **Nearby Search**: Uses geohash neighbors to find nearby pets

### Geohash Precision

- **Precision 7**: ~150m accuracy (used for storage)
- **Precision 6**: ~1.2km accuracy (used for radius searches)

### Recording Location

```typescript
// Frontend
await apiClient.recordGPSLocation(petId, lat, lng, 'At park');
```

### Finding Nearby Pets

```typescript
// Public endpoint
const nearby = await apiClient.findNearbyPets(lat, lng, 2); // 2km radius
```

## 🔔 Notifications

### Lost Pet Alerts

When a pet is marked as lost:
1. System gets last known GPS location
2. Finds nearby pets within 2km radius
3. Creates notifications for nearby users
4. TODO: Push notifications (FCM)
5. TODO: Email notifications (SendGrid)

### Notification Types

- `LOST_ALERT`: Pet marked as lost
- `LOST_PET_FOUND`: Pet found by someone
- `VACCINE_REMINDER`: Vaccine due date approaching

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Building Docker Images

```bash
# Backend
cd backend
docker build -t pet-platform-backend .

# Frontend
cd frontend
docker build -t pet-platform-frontend .
```

### Environment Variables for Docker

Set environment variables in `.env` file or docker-compose.yml:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=pet_platform
JWT_SECRET=your-secret
IMAGEKIT_PUBLIC_KEY=your-key
IMAGEKIT_PRIVATE_KEY=your-key
IMAGEKIT_URL_ENDPOINT=your-endpoint
```

## 🚢 Deployment

### Recommended Services

- **Frontend**: [Vercel](https://vercel.com) (Next.js optimized)
- **Backend**: [Fly.io](https://fly.io), [Render](https://render.com), or [Railway](https://railway.app)
- **Database**: [Neon](https://neon.tech) (serverless Postgres)
- **Images**: ImageKit (already configured)
- **Caching**: [Upstash](https://upstash.com) (serverless Redis)

### Vercel Deployment (Frontend)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend Deployment

#### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
cd backend
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-database-url"
fly secrets set JWT_SECRET="your-secret"
```

#### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run start:prod`
5. Add environment variables

### Database Migrations in Production

Migrations should run automatically on deployment. For manual migration:

```bash
cd backend
npx prisma migrate deploy
```

### Health Checks

- **Health**: `GET /health` - Returns service status
- **Readiness**: `GET /health/ready` - Returns readiness status

Configure these endpoints in your deployment platform for health monitoring.

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR:

1. **Lint**: Code linting and formatting checks
2. **Test Backend**: Unit tests with coverage
3. **Build**: Build both backend and frontend
4. **Docker**: Build and push Docker images (main branch only)

### CI Secrets Required

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/token

## 📖 Additional Documentation

- **REQUIREMENTS.md**: Complete requirements and architecture details
- **SPRINT_*.md**: Implementation summaries for each sprint
- **API Docs**: Swagger UI at `/docs/api` when backend is running

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure tests pass and coverage meets threshold
5. Submit a pull request

## 📝 License

Private - All rights reserved

## 🆘 Support

For issues and questions:
- Check Swagger API documentation at `/docs/api`
- Review `REQUIREMENTS.md` for architecture details
- Check existing issues in the repository
