<!-- Guidance for AI coding agents working on Ficha-OPRPG -->

# Brief Overview

This repository contains a Node/Express backend (`backend/`) with a MySQL database and a Next.js frontend (`frontend/`).

- Backend: CommonJS Node app. Server entry is `backend/src/server.js`, Express app in `backend/src/app.js`.
- Frontend: Next.js (app router) in `frontend/src/app`.

# Run & Dev Commands

- Backend (dev):
  - `cd backend`
  - `npm run dev` — starts `nodemon --watch src --ext js,json src/server.js` (listens on port `3001`).
- Backend seeds (data helpers):
  - `npm run seed` → `src/database/seedFeatures.js`
  - `npm run seed:test` → `src/database/seedTestData.js`
- Frontend (dev):
  - `cd frontend`
  - `npm run dev` — Next.js dev server (default port `3000`).

If you need to run both locally, launch backend first (API on `:3001`), then frontend.

# Environment & integration points

Backend loads `.env` via `dotenv` in `backend/src/config/database.js`.

Expected env vars:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `JWT_SECRET` (used by `backend/src/middlewares/authMiddleware.js`)

External dependencies to be aware of:
- MySQL (`mysql2`) — direct connection exported from `backend/src/config/database.js`.
- `jsonwebtoken`, `bcryptjs` for auth.

# Architectural patterns & conventions (important for code generation)

- Layering: Controllers → Services → Models. Controllers handle HTTP, Services contain business logic (often composing models and other services), Models wrap SQL operations.
  - Example: `characterController.create` delegates to `characterService.createCharacter`, which calls `characterModel.create` and `attributeModel.create`.
- Callback style: the backend uses Node-style callbacks (err, result) rather than Promises/async-await. New code should follow the existing callback pattern unless refactoring is agreed.
- CommonJS modules (`require`, `module.exports`) and `type: "commonjs"` in `backend/package.json`.

# Error handling & security patterns

- Authorization checks are often performed in services (example: `characterService.getFullCharacter` checks `character.user_id !== userId` and returns `{ message: 'Acesso negado' }`). Follow that style for owner checks.
- `authMiddleware` expects the `Authorization` header to be `Bearer <token>` and verifies with `JWT_SECRET`. On success it sets `req.user`.
- Map service errors to HTTP codes in controllers: 401 = unauthenticated, 403 = forbidden, 500 = server error.

# Database / Feature specifics

- `features` and `character_features` include `metadata` JSON and `training_level` enum. `featureService.getCharacterFeaturesGrouped` applies training bonuses — follow its structure when adding feature calculations.
- Creating a character triggers automatic attribute creation (`AttributeModel.create` in `characterService.createCharacter`). Preserve that flow when adding character endpoints.

# Files to reference when generating or changing code

- `backend/src/app.js` — central Express wiring and route mounts.
- `backend/src/server.js` — server entry (nodemon watches this file in dev).
- `backend/src/config/database.js` — DB connection details and required env vars.
- `backend/src/middlewares/authMiddleware.js` — JWT extraction & verification pattern.
- `backend/src/services/featureService.js` — example of grouping and metadata handling.

# When making changes or PRs

- Run the backend dev script and exercise endpoints with a HTTP client (Postman / curl). Backend logs connection and server startup to console.
- If you change the DB schema, update `database/Ficha_OPRPG_schema.sql` or add a migration note.
- Keep changes focused: avoid converting the entire codebase to async/Promises in a single PR without agreement.

# Known small quirks to watch for

- The codebase uses callbacks consistently; mixing in Promises adds noise — convert module-by-module if necessary.
- Small stray tokens or nonstandard lines may appear; if behavior looks odd, run the app to confirm.

---

If you'd like more concrete examples (sample API requests, expected request/response shapes, or local debugging steps), tell me which area to expand.
