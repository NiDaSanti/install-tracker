# Installation Tracker

A professional web application for tracking and managing solar panel installations (or any home system installations).

## Features

- ✅ Add, edit, and delete installations
- ✅ Track homeowner info, address, system size, and install dates
- ✅ Interactive map view with geocoding
- ✅ Professional tabbed interface
- ✅ Responsive design
- ✅ RESTful API backend

## Tech Stack

**Frontend:**
- React 19
- Leaflet (React Leaflet) for maps
- Axios for API calls
- CSS3 for styling

**Backend:**
- Node.js
- Express 5
- JSON file storage
- Nominatim geocoding API

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd install-tracker
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and configure:
```
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001
```

### 3. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_BASE_URL=http://localhost:3000
```

### 4. Run the Application

**Start Backend (Terminal 1):**
```bash
cd server
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd client
npm start
```

The app will open at `http://localhost:3001`

## Project Structure

```
install-tracker/
├── server/
│   ├── data/
│   │   ├── installations.development.json
│   │   └── installations.production.json
│   ├── routes/
│   │   ├── index.js              # Main routes
│   │   └── installations.js      # Installation CRUD
│   ├── index.js                  # Server entry point
│   ├── package.json
│   └── .env
└── client/
    ├── src/
    │   ├── Components/
    │   │   ├── InstallationForm.js
    │   │   ├── InstallationList.js
    │   │   └── InstallationMap.js
    │   ├── utils/
    │   │   └── geocode.js         # Address geocoding
    │   ├── App.js                 # Main component
    │   └── App.css                # Styles
    ├── package.json
    └── .env
```

## API Endpoints

### Installations

- `GET /api/installations` - Get all installations
- `GET /api/installations/:id` - Get single installation
- `POST /api/installations` - Create new installation
- `PUT /api/installations/:id` - Update installation
- `DELETE /api/installations/:id` - Delete installation

### Health Check

- `GET /health` - Server health check

## Environment Variables

### Server (.env)
```
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001
```

### Client (.env)
```
REACT_APP_API_BASE_URL=http://localhost:3000
```

## Deployment

### Backend Deployment (Render)

1. Push code to GitHub.
2. Create a new **Web Service** in Render pointed at the repository root.
3. Build command: `cd server && npm install`.
4. Start command: `cd server && npm start`.
5. Add a persistent disk (1 GB is plenty) mounted at `/opt/render/project/src/server/data` so JSON data survives deploys.
6. Configure environment variables:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://<your-frontend-onrender-url>`
   - `INSTALLATIONS_DATA_FILE=installations.production.json` (optional override; defaults to production file when `NODE_ENV=production`).

### Frontend Deployment (Render Static Site)

1. Create a **Static Site** on Render using the same repo.
2. Build command: `cd client && npm install && npm run build`.
3. Publish directory: `client/build`.
4. Environment variable:
   - `REACT_APP_API_BASE_URL=https://<your-backend-onrender-url>`
5. After the first deploy note the static site URL and update the backend `CLIENT_URL` value to match exactly.

## Features to Add

- [ ] User authentication
- [ ] Database migration (PostgreSQL/MongoDB)
- [ ] Export to CSV
- [ ] Search and filter
- [ ] Auto-zoom map to markers
- [ ] Email notifications
- [ ] Multi-user support

## License

MIT

## Author

Nick

## Support

For issues and questions, please open an issue on GitHub.
