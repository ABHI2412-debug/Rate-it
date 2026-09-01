# RateSpace

RateSpace is a dark glassmorphism store-rating platform with a Vite React frontend, Express API, PostgreSQL database, Prisma ORM, JWT authentication, and role-based administration. The frontend remains at the repository root; the API lives in `server/` and the database contract lives in `prisma/`.

## Install

```powershell
npm install
npm --prefix server install
```

The first command installs the frontend and Prisma tooling; the second installs the API's local dependencies. Generate Prisma Client before starting the API:

```powershell
npx prisma generate
```

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="a-long-random-secret"
PORT=5000
VITE_API_URL="http://localhost:5000/api"
```

`DATABASE_URL` must be a PostgreSQL connection string. Never commit `.env` or production secrets.

## Database and seed

With PostgreSQL running, apply the checked-in migration:

```powershell
npx prisma migrate dev
npm run prisma:seed
```

The seed creates one administrator, multiple normal users, twelve store owners, twelve stores, and realistic ratings across ten stores. Development/demo credentials:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@ratespace.demo` | `Admin@123!` |
| Normal user | `user@ratespace.demo` | `User@123!` |
| Store owner | `owner@ratespace.demo` | `Owner@123!` |

The public signup flow always creates a `USER`; admin and store-owner accounts are intentionally seed-only for this phase.

Signup names, admin-created user names, and store names must be 20–60 characters long. Addresses may be up to 400 characters. Passwords must be 8–16 characters and include an uppercase letter and a special character.

## Run locally

Start the API and frontend in separate terminals:

```powershell
npm run dev:server
npm run dev
```

The frontend is served by Vite, normally at `http://localhost:5173`; the API listens on `http://localhost:5000`.

API endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/users/me/password`
- Protected role foundations: `/api/admin/*`, `/api/owner/*`
- `GET /api/owner/dashboard` — STORE_OWNER-only live assigned-store information, average rating, total ratings, and recent customer ratings. The assigned store is derived from the authenticated JWT user.
- `GET /api/owner/ratings` — STORE_OWNER-only searchable, sortable, paginated ratings for the authenticated owner’s store. Accepts `search`, `sortBy` (`name`, `email`, `rating`, `date`), `sortOrder`, `page`, and `limit` (maximum 50). Frontend `storeId` and `ownerId` parameters are ignored.
- `GET /api/stores` — public store discovery; accepts `search`, `sortBy` (`name`, `address`, `overallRating`, `ratingCount`), `sortOrder` (`asc` or `desc`), `page`, and `limit` (default 12, maximum 50). Authenticated users also receive `userRating` and `userRatingId`.
- `GET /api/stores/:storeId` — store details, rounded overall rating, rating count, and the authenticated user’s rating when available.
- `POST /api/ratings` — USER-only `{ "storeId": "store-id", "rating": 5 }`.
- `PATCH /api/ratings/:ratingId` — USER-only `{ "rating": 4 }`; only the rating owner may update it.
- `GET /api/ratings/me` — USER-only list of the current user’s ratings with store summaries.
- `GET /api/admin/dashboard` — ADMIN-only live user, store, and rating counts.
- `GET /api/admin/users` — ADMIN-only searchable, role-filtered, sortable, paginated user directory.
- `POST /api/admin/users` — ADMIN-only user creation for `USER`, `ADMIN`, or `STORE_OWNER` roles.
- `GET /api/admin/users/:userId` — ADMIN-only user details, including Store Owner rating summary where applicable.
- `GET /api/admin/stores` — ADMIN-only searchable, sortable, paginated store directory with real rating aggregates.
- `POST /api/admin/stores` — ADMIN-only store creation with one-store-per-owner validation.
- `GET /api/admin/store-owners` — ADMIN-only list of unassigned Store Owners for store assignment.

Example rating request:

```powershell
Invoke-RestMethod http://localhost:5000/api/ratings -Method Post -Headers @{ Authorization = "Bearer <token>"; "Content-Type" = "application/json" } -Body '{"storeId":"<store-id>","rating":5}'
```

JWTs are centralized in the frontend API client and currently stored in localStorage for this challenge. That storage boundary can later be replaced with HTTP-only cookies without changing UI components.

## Routes

- `/login`, `/signup`: connected authentication screens
- `/dashboard/*`: authenticated normal-user workspace
- `/admin/dashboard`: admin-only platform dashboard
- `/owner/dashboard`: store-owner-only live store dashboard
- `/owner/ratings`: store-owner-only customer ratings directory
- `/owner/settings`: shared authenticated password settings
- `/403`: animated forbidden page

Admin dashboard, user management, store management, Store Owner dashboard, customer ratings, reviewer demo access, and password settings are implemented through real APIs. Store averages are calculated from the `Rating` records at request time; the composite `userId + storeId` constraint prevents duplicate ratings. Store Owner API ownership is resolved server-side from `JWT userId → Store.ownerId` and never from a frontend-supplied store or owner identifier.

## Reviewer quick start

1. Clone or open the project.
2. Install dependencies with `npm install` and `npm --prefix server install`.
3. Copy `.env.example` to `.env` and configure `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `VITE_API_URL`.
4. Start PostgreSQL.
5. Generate Prisma Client with `npx prisma generate`.
6. Apply the migration with `npx prisma migrate dev`.
7. Seed demo data with `npm run prisma:seed`.
8. Start the API with `npm run dev:server`.
9. Start the frontend in another terminal with `npm run dev`.
10. Open the Vite URL and use the Demo Credentials panel on the Login page to test each role.

The login page uses the real login API, bcrypt-backed database accounts, JWT authentication, and role redirects. Admins land at `/admin/dashboard`, normal users at `/dashboard`, and Store Owners at `/owner/dashboard`.
