# Installation Tracker

Installation Tracker is a full-stack workspace for operations teams to record, visualize, and manage residential solar (or similar field-service) installations. The app brings together fast data entry, CSV bulk import, geocoded mapping, and lightweight analytics in a single dashboard.

## Highlights

- Responsive React dashboard with list, map, and analytics views
- Single-install form with built-in geocoding validation
- Bulk CSV uploader that surfaces row-level issues before sending data
- Secure API with per-user data isolation (optional) backed by JSON storage
- CLI utility to convert CSV files into API-ready JSON payloads
- Render-friendly deployment instructions for both frontend and backend

## How the App Works

1. **Authenticate & Load** – Users sign in, the client stores a JWT, and requests begin flowing through the shared Axios client.
2. **Dashboard Overview** – The desktop layout shows key metrics, the master installation list, an interactive Leaflet map, and a dedicated panel for adding installations; tablets/phones switch to tabbed navigation.
3. **Single Entry Mode** – The manual form gathers homeowner demographics, validates inputs, geocodes the address, and posts to `POST /api/installations`. Successful saves append the record to the in-memory list without a full reload.
4. **Bulk Upload Mode** – Operators can download a pre-formatted CSV template, drag in up to 150 rows, and the client validates every row (required columns, positive system size, numeric coordinates). Only clean rows are sent to `POST /api/installations/bulk`; any server-side validation problems cascade back into the UI with pointers to the offending rows.
5. **Mapping & Analytics** – Installations render as map markers (with territory overlays) and feed summary widgets that compute totals, deltas, and top segments in real time.

## Quick Start

### Prerequisites

- Node.js 18 or newer
- npm (bundled with Node)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd install-tracker

# Backend
cd server
npm install
cp .env.example .env

# Frontend
cd ../client
npm install
cp .env.example .env
```

### 2. Configure Environment

`server/.env` (minimum)

```
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001
```

`client/.env`

```
REACT_APP_API_BASE_URL=http://localhost:3000
```

Optional server flags:

- `INSTALLATIONS_PER_USER=true` – isolate data per authenticated user (defaults to true).
- `INSTALLATIONS_DATA_FILE` – override the shared JSON filename.
- `INSTALLATIONS_DATA_DIR` – custom directory for per-user storage.

### 3. Run Locally

```bash
# Terminal 1 – API
cd server
npm run dev

# Terminal 2 – React app
cd client
npm start
```

Frontend boots at `http://localhost:3001`, proxied through `client/package.json` to reach the API.

## Using Bulk Upload

### In the UI

1. Navigate to **Add installation → Bulk upload**.
2. Download the sample template (`client/public/templates/installations-template.csv`) if needed.
3. Select your CSV; invalid rows are highlighted with exact reasons (missing homeowner, bad coordinates, etc.).
4. Fix issues until the summary shows “0 rows need attention,” then press **Upload**.
5. Successful imports immediately appear in the list, map, and analytics; mobile users are bounced to the list tab automatically.

### From the CLI

```
cd server
npm run bulk:prepare -- ../data/my-installs.csv payload.json

# Then
curl -X POST http://localhost:3000/api/installations/bulk \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <token>' \
   -d @payload.json
```

`bulk:prepare` mirrors the client-side validation and produces JSON the API accepts.

## Tech Stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 19, React Router (built-in page flow), Axios, React Leaflet, Papaparse, custom CSS |
| Backend  | Node.js, Express 5, JSON file persistence, dotenv |
| Utilities | Geocoding via Nominatim, csv-parse for CLI conversions |

## Project Layout (selected files)

```
install-tracker/
├── server/
│   ├── data/                          # JSON persistence (auto-created)
│   ├── routes/
│   │   └── installations.js           # CRUD + bulk endpoints
│   ├── scripts/
│   │   └── csv-to-bulk.js             # CSV → JSON helper
│   ├── index.js
│   └── package.json
└── client/
      ├── public/
      │   └── templates/
      │       └── installations-template.csv
      ├── src/
      │   ├── Components/
      │   │   ├── InstallationEntry.js   # Toggle between single and bulk modes
      │   │   ├── InstallationForm.js
      │   │   ├── BulkUpload.js
      │   │   ├── InstallationList.js
      │   │   ├── InstallationMap.js
      │   │   └── Login.js
      │   ├── utils/
      │   │   └── geocode.js
      │   ├── apiClient.js               # Axios instance with auth interceptor
      │   ├── App.js / App.css
      │   └── Icons.js
      └── package.json
```

## API Overview

All routes are prefixed with `/api` on the server.

| Method | Route                         | Description |
|--------|-------------------------------|-------------|
| GET    | `/installations`              | Fetch all installations for the current user |
| GET    | `/installations/:id`          | Fetch a single installation |
| POST   | `/installations`              | Create one installation (form submission) |
| POST   | `/installations/bulk`         | Create many installations at once |
| PUT    | `/installations/:id`          | Update an installation |
| DELETE | `/installations/:id`          | Remove an installation |

Non-namespaced endpoints:

- `GET /health` – service liveness probe.

## Data & Validation

- Records include homeowner details, location, system size, optional coordinates, and timestamps.
- IDs are generated server-side (`<timestamp>-<random>`), and owner metadata is derived from `req.user`.
- Bulk uploads reject any row with missing required fields or non-positive system size; the API responds with a list of failed indices so the client can surface them.
- When per-user storage is enabled, each user’s data is persisted to `server/data/installations/<username>.development.json` and optionally seeded from the shared file the first time they sign in.

## Deployment Tips (Render)

### Backend Web Service

| Setting          | Value |
|------------------|-------|
| Build Command    | `cd server && npm install` |
| Start Command    | `cd server && npm start` |
| Persistent Disk  | Mount at `/opt/render/project/src/server/data` (≥1 GB) |
| Environment Vars | `NODE_ENV=production`, `CLIENT_URL=https://<frontend-url>` |

Optional: set `INSTALLATIONS_DATA_FILE=installations.production.json` for clarity.

### Frontend Static Site

| Setting          | Value |
|------------------|-------|
| Build Command    | `cd client && npm install && npm run build` |
| Publish Directory| `client/build` |
| Environment Vars | `REACT_APP_API_BASE_URL=https://<backend-url>` |

After the first deploy, update the backend `CLIENT_URL` to the final static site URL to satisfy CORS.

## Roadmap Ideas

- Authentication backed by a persistent database
- Rich filtering and search across installations
- Export / reporting pipeline
- Map clustering and territory overlays sourced from a GIS service
- Webhooks or email alerts for new installs

## Support & Contributing

Issues, enhancement ideas, and bug reports are welcome—open a GitHub issue or submit a pull request.

License: MIT • Author: Nick
