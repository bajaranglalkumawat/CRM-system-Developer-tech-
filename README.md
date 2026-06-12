# Developer Tech LLP - Private CRM

A production-ready private CRM web application built for Developer Tech LLP. Admin-only access, no public registration.

## Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS 4 with dark mode
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Deployment**: Docker + Docker Compose + Nginx

## Features

- Admin-only authentication (single user, no signup)
- Dashboard with stats and recent activity
- Client Management (CRUD, search, profiles, notes)
- Project Management (status tracking, progress, due dates)
- Invoice Module (create, PDF generation, payment tracking)
- Website Monitoring (URL health checks, response times)
- Dark mode, mobile responsive
- Security hardened (rate limiting, CSRF, security headers)

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- npm

### Installation

```bash
# 1. Clone and install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# 3. Generate Prisma Client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed admin user
npx prisma db seed

# 6. Start development server
npm run dev
```

Visit `http://localhost:3000` and login with your admin credentials.

## Production Deployment (Docker)

### 1. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://crm_user:strong_password@db:5432/crm_db?schema=public"
POSTGRES_USER="crm_user"
POSTGRES_PASSWORD="strong_password"
POSTGRES_DB="crm_db"
NEXTAUTH_SECRET="your-random-secret-64-chars"
NEXTAUTH_URL="https://crm.developertech.in"
ADMIN_EMAIL="admin@developertech.in"
ADMIN_PASSWORD="your-secure-admin-password"
```

### 2. Build and Run

```bash
cd docker
docker compose up -d --build
```

### 3. Run Database Migrations and Seed

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### 4. SSL Setup (Let's Encrypt)

```bash
# Install certbot on your VPS
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d crm.developertech.in

# Copy certificates to nginx ssl directory
sudo cp /etc/letsencrypt/live/crm.developertech.in/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/crm.developertech.in/privkey.pem docker/nginx/ssl/

# Update docker/nginx/nginx.conf - uncomment SSL lines
# Restart nginx
docker compose restart nginx
```

## VPS Deployment Guide

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Clone repository
git clone <your-repo-url> /opt/crm
cd /opt/crm
```

### 2. Configure and Deploy

```bash
# Copy and edit environment file
cp .env.example .env
nano .env

# Build and start
cd docker
docker compose up -d --build

# Run migrations
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### 3. Setup Auto-Backup

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/crm/scripts/backup.sh
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret (64+ chars) | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `ADMIN_EMAIL` | Admin login email | Yes |
| `ADMIN_PASSWORD` | Admin login password | Yes |
| `POSTGRES_USER` | PostgreSQL username | Docker only |
| `POSTGRES_PASSWORD` | PostgreSQL password | Docker only |
| `POSTGRES_DB` | PostgreSQL database name | Docker only |

## Security

- Admin-only access (no public registration)
- JWT authentication with 24h session timeout
- Password hashing with bcrypt (12 rounds)
- Security headers (HSTS, X-Frame-Options, CSP)
- Rate limiting on API and login routes
- CSRF protection
- SQL injection protection via Prisma ORM
- HTTPS required in production
- Secure HTTP-only cookies
- Nginx directory listing disabled

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx prisma studio` | Open Prisma database UI |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma db seed` | Seed admin user |
| `scripts/backup.sh` | Database backup script |

## License

Private - Developer Tech LLP. All rights reserved.
