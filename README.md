# APCTT TechTransfer Connect

A platform for the Asia Pacific region that connects technology providers, organizations, and individuals looking for technology transfer, partnerships, and matching between needs and available technologies.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (pg), plus a JSON file store at server/data.json for some content |
| Matching feature | Google Gemini API |
| Auth | JWT access and refresh tokens, bcrypt password hashing |
| Email | Resend and/or SMTP via nodemailer |
| Bot protection | Cloudflare Turnstile |
| Styling | Plain CSS, no framework |
| Icons | Lucide React |

## Folder layout

```
apttp/
├── components/        Shared UI components (Navbar, Footer, Pagination, etc.)
├── context/            React context providers (auth, chat, config, opportunities, site content)
├── pages/               Route level page components
├── services/            Frontend API and Gemini service wrappers
├── server/
│   ├── index.ts         Express app entry point and most API routes
│   ├── db.ts             Postgres connection pool
│   ├── data.json         JSON store for content that is not yet in Postgres
│   ├── middleware/        Auth and role checks
│   ├── routes/            Split out routers (email verification, moderation, role requests)
│   ├── utils/              JWT and password helper functions
│   └── config/security.ts  Rate limit and security config
├── types.ts             Shared TypeScript types
├── App.tsx              Router and context provider setup
├── Dockerfile            Two stage build, frontend build then Node runtime
└── deployment_guide.md   Deploy notes (Railway and Render)
```

## Prerequisites

- Node.js 20 or newer
- A PostgreSQL database
- npm

## Environment variables

The server reads these from server/.env (that file is git ignored, so create it yourself):

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | Postgres connection string |
| PORT | Server port, defaults to 3001 |
| NODE_ENV | development or production |
| JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY | Token lifetimes |
| BCRYPT_ROUNDS | Password hash cost |
| COOKIE_DOMAIN, COOKIE_PATH, COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_NAME | Refresh token cookie settings |
| RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS, REGISTER_RATE_LIMIT_MAX, REFRESH_RATE_LIMIT_MAX, REFRESH_RATE_LIMIT_WINDOW_MS | Rate limiting per route |
| EMAIL_PROVIDER, EMAIL_PROVIDER_FALLBACK_TO_SMTP | Which email path to use |
| RESEND_API_KEY, RESEND_FROM | Resend email settings |
| SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM | SMTP fallback settings |
| TURNSTILE_ENABLED, TURNSTILE_SECRET_KEY | Cloudflare Turnstile bot check |
| GEMINI_API_KEY | Google Gemini key for the matchmaker feature |
| BACKEND_BASE_URL | Base URL the frontend uses to reach the API |

Known issue: server/db.ts currently has a Postgres host, user, and password hardcoded in the file instead of reading from DATABASE_URL. Move that connection info into environment variables before sharing this repo publicly or deploying it.

## Local setup

```bash
# install frontend deps
npm install

# install server deps
cd server && npm install && cd ..

# run the frontend dev server
npm run dev

# in a second terminal, run the backend
cd server && npm run dev
```

The frontend dev server runs through Vite. The backend runs on the port set by PORT, 3001 by default.

## Combined build (what gets deployed)

```bash
npm run build:full   # builds the frontend into dist, then installs server deps
npm start            # runs the Express server, which also serves the built frontend from dist
```

Visit http://localhost:3001 once both steps finish.

## Available scripts

Root package.json:
- npm run dev — Vite dev server for the frontend
- npm run build — production frontend build
- npm run build:full — frontend build plus server dependency install
- npm start — runs the server, which also serves the frontend build

server/package.json:
- npm run dev — nodemon plus ts node for local backend development
- npm run migrate — runs migrate.ts against the database
- npm test — runs tests/auth-role.test.ts

## User roles

Handled through AuthContext and server/middleware/roleMiddleware.ts:
- Platform Admin — full governance, reviews identity documents
- Organization Representative — manages an organization's technologies and members
- Organization Member — read access plus participation in discussions tied to their organization
- Individual — basic access for independent users

New accounts go through email verification, then can optionally upload a document to request a verified partner badge, which an admin approves.

## Main API routes

All under server/index.ts unless noted:
- POST /api/register, POST /api/login, POST /api/logout, POST /api/refresh token (token refresh via cookie)
- POST /api/auth/forgot password, POST /api/auth/reset password, POST /api/auth/change password
- GET /api/technologies, POST /api/technologies (needs a verified user)
- GET /api/tech needs, POST /api/tech needs
- GET /api/opportunities, POST /api/opportunities
- GET /api/stakeholders, PUT /api/stakeholders/:id (admin only)
- GET /api/users, GET /api/users/public, PUT /api/users/:id, DELETE /api/users/:id (admin only)
- GET /api/content, GET /api/admin/content, PUT /api/content/:key
- GET /api/search, GET /api/stats
- GET /health, GET /api/health/db for health checks
- Additional routers mounted from server/routes/: email verification, moderation, role requests

## Deployment

See deployment_guide.md for the full walkthrough. Short version: the Dockerfile builds the frontend then runs the Express server, which serves the built frontend and the API from one process on port 10000 (or whatever PORT is set to). Railway and Render both work by pointing at this Dockerfile.

## Data storage note

Some content (site text, a few lookups) still lives in server/data.json rather than Postgres. Treat this as a file based store, it is not safe for concurrent writes at scale and does not persist across some hosting platforms unless a volume is attached.
