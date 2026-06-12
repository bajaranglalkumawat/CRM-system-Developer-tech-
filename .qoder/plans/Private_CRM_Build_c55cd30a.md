# Private CRM for Developer Tech LLP - Build Plan

## Architecture Overview

- **Framework**: Next.js 14 with App Router (handles both frontend and API routes)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js with JWT strategy, credentials provider
- **Styling**: Tailwind CSS with dark mode via `next-themes`
- **PDF Generation**: `jspdf` + `jspdf-autotable`
- **Deployment**: Docker + Docker Compose + Nginx reverse proxy with SSL

---

## Folder Structure

```
e:\CRM system\
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx                  (root layout, providers)
│   │   ├── page.tsx                    (redirect to /login or /dashboard)
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx                (list + search)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx            (profile)
│   │   │       └── edit/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── monitoring/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── clients/route.ts
│   │       ├── clients/[id]/route.ts
│   │       ├── projects/route.ts
│   │       ├── projects/[id]/route.ts
│   │       ├── invoices/route.ts
│   │       ├── invoices/[id]/route.ts
│   │       ├── invoices/[id]/pdf/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── monitoring/route.ts
│   │       └── monitoring/check/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── dashboard/
│   │   │   └── StatsCard.tsx
│   │   ├── clients/
│   │   │   └── ClientForm.tsx
│   │   ├── projects/
│   │   │   └── ProjectForm.tsx
│   │   ├── invoices/
│   │   │   └── InvoiceForm.tsx
│   │   └── monitoring/
│   │       └── MonitorForm.tsx
│   ├── lib/
│   │   ├── auth.ts                     (NextAuth config)
│   │   ├── prisma.ts                   (Prisma client singleton)
│   │   ├── rate-limit.ts
│   │   ├── csrf.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   └── useToast.ts
│   └── types/
│       └── index.ts
├── public/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx/
│       └── nginx.conf
├── scripts/
│   └── backup.sh
├── middleware.ts                        (route protection)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── .env.example
├── package.json
└── README.md
```

---

## Phase 1: Project Scaffolding

**Step 1**: Initialize Next.js project with TypeScript and Tailwind CSS using `npx create-next-app@latest` (non-interactive flags).

**Step 2**: Install all dependencies:
- `next-auth`, `bcryptjs`, `prisma`, `@prisma/client`
- `jsonwebtoken`, `jose`
- `jspdf`, `jspdf-autotable`
- `next-themes`
- `react-hot-toast`
- `node-cron` (for monitoring checks)
- `lucide-react` (icons)

Dev dependencies: `@types/bcryptjs`, `@types/jsonwebtoken`

---

## Phase 2: Database Schema (Prisma)

**File**: `prisma/schema.prisma`

Models:
- **User**: id, email (unique), password (hashed), name, role, createdAt, updatedAt
- **Client**: id, name, phone, email, company, address, projectType, notes, createdAt, updatedAt
- **Project**: id, title, description, status (enum: PENDING, WORKING, DELIVERED, COMPLETED), dueDate, progress (Int 0-100), clientId (FK), createdAt, updatedAt
- **Invoice**: id, invoiceNumber (unique), serviceName, amount, date, status (enum: PENDING, PAID, OVERDUE), clientId (FK), createdAt, updatedAt
- **Payment**: id, amount, date, method, invoiceId (FK), createdAt
- **MonitoringLog**: id, url, status (UP/DOWN), statusCode (Int), lastChecked, responseTime (Int), createdAt

**Step**: Run `prisma migrate dev` to create migrations, then `prisma db seed` to seed the admin user.

**Seed** (`prisma/seed.ts`): Creates admin user with email `admin@developertech.in` and password from `ADMIN_PASSWORD` env variable (hashed with bcrypt).

---

## Phase 3: Authentication

**File**: `src/lib/auth.ts`
- NextAuth with CredentialsProvider
- Verify email + password against DB using bcrypt
- JWT strategy with 24h maxAge
- Custom JWT callback to embed userId and role

**File**: `src/middleware.ts`
- Protect all routes except `/login` and `/api/auth/*`
- Redirect unauthenticated users to `/login`
- Session timeout handling

**File**: `src/app/api/auth/[...nextauth]/route.ts`
- NextAuth route handler

**File**: `src/app/login/page.tsx`
- Clean login form (email + password)
- No signup link, no registration
- Error messages for invalid credentials

---

## Phase 4: Core UI Components

Build reusable components in `src/components/ui/`:
- **Button**: Primary, secondary, danger variants with loading state
- **Input**: Text, email, password with label and error state
- **Card**: Container with shadow and optional header
- **Modal**: Overlay dialog with close button
- **Table**: Sortable columns, responsive
- **Badge**: Color-coded status labels
- **Select**: Dropdown with options
- **Toast**: Success/error notifications via react-hot-toast
- **LoadingSpinner**: Centered spinner

**Layout Components** in `src/components/layout/`:
- **Sidebar**: Navigation links (Dashboard, Clients, Projects, Invoices, Monitoring), collapsible on mobile, active state highlighting
- **Header**: Page title, dark mode toggle, user menu with logout
- **DashboardLayout**: Wraps sidebar + header + main content area

**File**: `src/app/layout.tsx`
- ThemeProvider (next-themes)
- Toaster (react-hot-toast)
- SessionProvider wrapper

---

## Phase 5: Dashboard

**File**: `src/app/api/dashboard/route.ts`
- Aggregate queries: total clients, active projects (status != COMPLETED), revenue (sum of paid invoices), pending payments (sum of pending invoices)
- Recent activity: last 10 actions (created clients, projects, invoices)

**File**: `src/app/dashboard/page.tsx`
- Stats cards grid (4 cards): Total Clients, Active Projects, Revenue, Pending Payments
- Recent activity feed
- Responsive grid layout

---

## Phase 6: Client Management

**API Routes**:
- `GET /api/clients` - List all clients with search query param (name, email, company)
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get single client with related projects and invoices
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client (cascade soft-delete consideration)

**Pages**:
- `/clients` - Client list with search bar, table, add button
- `/clients/new` - Client creation form
- `/clients/[id]` - Client profile showing details, related projects, invoices, notes
- `/clients/[id]/edit` - Edit form

**Component**: `ClientForm.tsx` - Shared form for create/edit with validation

---

## Phase 7: Project Management

**API Routes**:
- `GET /api/projects` - List with filter by status and clientId
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Project details with client info
- `PUT /api/projects/[id]` - Update (status, progress, etc.)
- `DELETE /api/projects/[id]` - Delete project

**Pages**:
- `/projects` - Project list with status filter tabs, progress bars
- `/projects/new` - Create form with client selector
- `/projects/[id]` - Project detail with status update, progress slider

**Component**: `ProjectForm.tsx` - Form with client dropdown, status select, date picker, progress input

---

## Phase 8: Invoice Module

**API Routes**:
- `GET /api/invoices` - List all with filter by status
- `POST /api/invoices` - Create invoice with auto-generated invoice number
- `GET /api/invoices/[id]` - Invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/[id]/pdf` - Generate and return PDF

**PDF Generation**: Use `jspdf` + `jspdf-autotable` to create professional invoice PDF with:
- Company header (Developer Tech LLP)
- Invoice number, date
- Client details
- Service name and amount
- Total

**Pages**:
- `/invoices` - Invoice list with status badges, download buttons
- `/invoices/new` - Create form
- `/invoices/[id]` - Invoice detail with PDF download button

---

## Phase 9: Monitoring Module

**API Routes**:
- `GET /api/monitoring` - List all monitored URLs with latest status
- `POST /api/monitoring` - Add URL to monitor
- `DELETE /api/monitoring/[id]` - Remove monitored URL
- `POST /api/monitoring/check` - Trigger health check for all URLs (stores results in MonitoringLog)

**Health Check**: Uses `fetch` to check URL status, records response time and status code.

**Page**: `/monitoring`
- Table of monitored URLs with status indicators (green/red)
- Last checked time, response time
- Manual check button
- Add/remove URLs

---

## Phase 10: Security Hardening

**File**: `src/lib/rate-limit.ts`
- Token bucket rate limiter for API routes (especially auth)

**File**: `src/middleware.ts`
- CSRF token validation for state-changing requests
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

**File**: `src/lib/csrf.ts`
- CSRF token generation and validation

**Additional Security**:
- All passwords hashed with bcrypt (12 rounds)
- JWT tokens with secure signing
- HTTP-only, secure, SameSite cookies
- Environment variables for all secrets
- Prisma parameterized queries (SQL injection protection)
- No directory listing in production

---

## Phase 11: Dark Mode + Responsive Design

- Use `next-themes` with system/light/dark toggle
- Tailwind `dark:` variants on all components
- Mobile-responsive sidebar (hamburger menu on small screens)
- Responsive tables (horizontal scroll on mobile)
- Touch-friendly buttons and inputs

---

## Phase 12: Docker + Deployment

**File**: `docker/Dockerfile`
- Multi-stage build (deps, build, production)
- Node.js 20 Alpine base
- Run Prisma generate and migrations

**File**: `docker/docker-compose.yml`
- Services: app (Next.js), db (PostgreSQL 16), nginx (reverse proxy)
- Volumes for PostgreSQL data
- Environment variables from `.env`

**File**: `docker/nginx/nginx.conf`
- Reverse proxy to Next.js app
- SSL termination (Let's Encrypt placeholders)
- Security headers
- Disable directory listing
- Gzip compression
- Rate limiting at nginx level

**File**: `scripts/backup.sh`
- PostgreSQL pg_dump backup script
- Timestamped backup files
- Retention policy (keep last 30 days)

---

## Phase 13: Error Pages + Polish

- Custom 404 page (`src/app/not-found.tsx`)
- Custom error page (`src/app/error.tsx`)
- Loading states with skeletons on all pages
- Toast notifications for all CRUD operations
- README.md with installation and deployment instructions

---

## Execution Order

1. Scaffold Next.js project + install deps
2. Set up Prisma schema + seed script
3. Build auth system (NextAuth + middleware)
4. Build UI component library
5. Build layout (sidebar, header)
6. Implement Dashboard
7. Implement Client Management
8. Implement Project Management
9. Implement Invoice Module (with PDF)
10. Implement Monitoring Module
11. Add security hardening (rate limiting, CSRF, headers)
12. Add dark mode + responsive polish
13. Docker + Nginx + deployment configs
14. Backup script + error pages + README
