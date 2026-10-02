# Taxi Collectif API

Backend API for a shared taxi service. It provides cookie-based authentication and endpoints for managing users, drivers, stations, routes, vehicles, station entrances, and seat reservations. The application is built with Next.js App Router, TypeScript, Prisma ORM, and PostgreSQL.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Run the application](#run-the-application)
- [API overview](#api-overview)
- [Authentication and authorization](#authentication-and-authorization)
- [Data model](#data-model)
- [Project layout](#project-layout)
- [Useful commands](#useful-commands)

## Features

- Email or username sign-in with Better Auth session cookies.
- Password change and password reset flows.
- Role-aware access control for passengers, agents, administrators, super administrators, and drivers.
- CRUD APIs for users, drivers, stations, routes, vehicles, and entrances.
- Reservation creation, lookup, update, deletion, and seat-reference cancellation.
- Paginated, searchable, and filtered collection endpoints.
- PostgreSQL persistence through Prisma ORM 7 and the PostgreSQL driver adapter.
- Consistent JSON API response envelopes and input validation with Zod.

## Technology

- Next.js `16.3.0` (App Router route handlers)
- React `19.2.8` and TypeScript
- PostgreSQL
- Prisma ORM `7.9.x` with `@prisma/adapter-pg`
- Better Auth
- Zod
- Resend API for optional password-reset email delivery

## Requirements

- Node.js compatible with the installed Next.js 16 release
- npm
- PostgreSQL

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file in the repository root. At minimum, set `DATABASE_URL` to a PostgreSQL database you can access. See [Environment variables](#environment-variables).

3. Apply the checked-in migrations and generate Prisma Client:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

   `prisma.config.ts` loads `.env` and points the Prisma CLI to `prisma/schema.prisma` and `prisma/migrations`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). API routes are under `/api`.

There is no seed script configured in `package.json` or `prisma.config.ts`. Sign-up is disabled in Better Auth, so provision an initial account using the project's authorized user-management workflow before signing in.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma and the application. |
| `BETTER_AUTH_SECRET` | Yes for deployed environments | Secret used by Better Auth to secure authentication. Provide a strong, private value. The source has a development fallback; do not rely on it in production. |
| `BETTER_AUTH_URL` | Recommended | Base URL for Better Auth, for example `http://localhost:3000` locally or the deployed application URL. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | When needed | Comma-separated trusted browser origins, for example `http://localhost:3000,http://localhost:3001`. |
| `NEXT_PUBLIC_APP_URL` | Optional | Fallback application URL used for Better Auth and password reset links. |
| `FRONTEND_URL` | Optional | Frontend base URL used to build password reset links; takes precedence over the other URL fallbacks for reset links. |
| `RESEND_API_KEY` | Optional | Resend API key for sending password-reset emails. If unset, reset links are written to the server log for local development. |
| `RESET_PASSWORD_FROM_EMAIL` | Optional | Sender identity for reset emails. Defaults to `Taxi Collectif <onboarding@resend.dev>`. |

Example local configuration (replace the database URL and secret with your own values):

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taxi_collectif"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# FRONTEND_URL="http://localhost:3001"
# RESEND_API_KEY=""
# RESET_PASSWORD_FROM_EMAIL="Taxi Collectif <onboarding@resend.dev>"
```

Keep real credentials in `.env` and do not commit them. The Prisma client also has a local fallback connection string in source; configuring `DATABASE_URL` explicitly is recommended so both the CLI and app use the intended database.

## Run the application

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Serve the production build
npm run start

# Run ESLint
npm run lint
```

## API overview

All application endpoints are prefixed with `/api`. JSON request bodies should use `Content-Type: application/json`. The resource controllers validate inputs and generally return an `ApiResponse` envelope:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Collection responses that support pagination include a `pagination` object with `page`, `limit`, `total`, and `totalPages`. Validation errors use HTTP `400`; unauthenticated requests use `401`; disallowed roles use `403`; missing records use `404`.

### Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in with `email` or `username` and `password`; sets session cookies. |
| `POST` | `/api/auth/logout` | End the current session. |
| `GET` | `/api/auth/me` | Return the current authenticated user. |
| `POST`, `PATCH` | `/api/auth/change-password` | Change the signed-in user's password using `currentPassword` and `newPassword`. |
| `POST` | `/api/auth/forgot-password` | Request a reset link with `email` and optional `redirectTo`. |
| `POST` | `/api/auth/reset-password` | Set a new password using `token` and `newPassword`. |
| `GET`, `POST` | `/api/auth/[...all]` | Better Auth handler for its supported authentication endpoints. |

Example sign-in:

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"person@example.com","password":"your-password"}'
```

The login response sets an HTTP-only session cookie. Keep and send that cookie on subsequent protected requests. Browser clients should send requests with credentials enabled (for example, `fetch(url, { credentials: "include" })`).

### Resource endpoints

| Resource | Collection endpoint | Item / action endpoints |
| --- | --- | --- |
| Users | `GET, POST /api/users` | `GET, PATCH, DELETE /api/users/{id}` |
| Drivers | `GET, POST /api/drivers` | `GET, PATCH /api/drivers/{id}`; lookups by `/api/drivers/driving-license/{drivingLicence}`, `/api/drivers/driving-licence/{drivingLicence}`, and `/api/drivers/professional-id-card/{professionalIdCard}` |
| Stations | `GET, POST /api/stations` | `GET, PATCH, DELETE /api/stations/{id}` |
| Routes | `GET, POST /api/routes` | `GET, PATCH, DELETE /api/routes/{id}` |
| Vehicles | `GET, POST /api/vehicles` | `GET, PATCH, DELETE /api/vehicles/{id}` |
| Entrances | `GET, POST /api/entrances` | `GET, PATCH, DELETE /api/entrances/{id}` |
| Reservations | `GET, POST /api/reservations` | `GET, PATCH, DELETE /api/reservations/{id}`; `GET /api/reservations/ref/{reservationRef}`; `PATCH /api/reservations/{id}/seat-refs/cancel` |

Item IDs are numeric for stations, routes, vehicles, entrances, and reservations. User, driver, and Better Auth IDs are strings. A reservation reference is a string generated by the application.

Most collection endpoints accept `page` and `limit` query parameters. Common optional filters include `search`; individual resources also support filters such as `status`, `role`, `city`, `governorate`, `stationId`, `routeId`, `vehicleId`, `entranceId`, and `reservationRef`. Supported filters vary by endpoint. Pagination defaults to page `1` and limit `10`; limits are capped by each resource's validation rules.

Reservation creation accepts `numberOfSeats`, `entranceId`, and optional `userId`. Passengers are associated with their own account by the API. Seat cancellations accept one or both of `seatRefIds` and `reservationRefs` in the request body to `PATCH /api/reservations/{id}/seat-refs/cancel`.

### Authorization

The login and current-user flows use Better Auth sessions stored in HTTP-only cookies. Protected controllers validate the session from request headers. Management operations have role checks; the roles used by the data model are `Passanger`, `Agent`, `Admin`, `SuperAdmin`, and `Driver`. Agents may be scoped to their assigned station on supported operations. Account creation through Better Auth's built-in sign-up is disabled.

For exact request fields and role requirements, see the route handler and module controller/validation files under `src/app/api` and `src/modules`.

## Data model

The Prisma schema defines the following main records:

- **User**: profile, credentials, role/status, optional station assignment, auth sessions/accounts, and reservations.
- **Driver**: driver identity and license details linked one-to-one with a user.
- **Station**: location and GPS radius; related to routes, entrances, and users.
- **Route**: destinations, fare, description, and associated stations and vehicles.
- **Vehicle**: registration, capacity, status, insurance/inspection dates, and optional route.
- **Entrance**: a vehicle, station, and driver association with a dispatch status.
- **Reservation**: seat count and reference, attached to an entrance and optionally to a user.
- **ReservationSeatRef**: individual seat references with active/cancelled status.
- **Session**, **Account**, and **Verification**: Better Auth persistence.

The complete schema and migration history are in `prisma/schema.prisma` and `prisma/migrations/`.

## Project layout

```text
src/
  app/api/       Next.js API route handlers
  modules/       Feature modules: auth, users, drivers, stations, routes,
                 vehicles, entrances, reservations
  middleware/    Session and role helpers
  lib/           Prisma, Better Auth, and email integrations
  config/        Application configuration
  types/         Shared API types
  utils/         Pagination and date helpers
prisma/
  schema.prisma
  migrations/
```

Each resource module separates controller, service, repository, validation, DTO, and types where applicable. Route handlers in `src/app/api` connect URLs to those controllers.

## Useful commands

```bash
# Apply/create migrations during development
npx prisma migrate dev

# Apply checked-in migrations in deployment
npx prisma migrate deploy

# Regenerate the Prisma client after schema changes
npx prisma generate

# Inspect the configured database
npx prisma studio

# Check migration state
npx prisma migrate status
```

When changing the Prisma schema, create a named migration with `npx prisma migrate dev --name describe_change`, then regenerate the client if needed. There is currently no seed command or seed data configured.
