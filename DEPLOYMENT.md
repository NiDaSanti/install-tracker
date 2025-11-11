# Deployment Guide

## Quick Deploy Steps

### Option 1: Vercel (Frontend) + Render (Backend) - Recommended

#### Backend Deployment (Render)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Sign up/Login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `installation-tracker-api`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Add Environment Variables:
     - `NODE_ENV` = `production`
     - `CLIENT_URL` = (leave blank for now, add after frontend deploy)
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL (e.g., `https://installation-tracker-api.onrender.com`)

#### Frontend Deployment (Vercel)

1. **Update Frontend Environment**
   - In `client/.env.production`, add:
     ```
     REACT_APP_API_URL=https://installation-tracker-api.onrender.com
     ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
   - Add Environment Variable:
     - `REACT_APP_API_URL` = `https://installation-tracker-api.onrender.com`
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your frontend URL (e.g., `https://installation-tracker.vercel.app`)

3. **Update Backend CORS**
   - Go back to Render dashboard
   - Open your backend service
   - Go to "Environment"
   - Add/Update:
     - `CLIENT_URL` = `https://installation-tracker.vercel.app`
   - Service will auto-redeploy

### Option 2: Railway (Full Stack)

1. **Deploy on Railway**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   
2. **Configure Backend**
   - Add service for backend
   - Root directory: `server`
   - Start command: `npm start`
   - Add env vars: `NODE_ENV=production`
   - Copy backend URL

3. **Configure Frontend**
   - Add service for frontend
   - Root directory: `client`
   - Build command: `npm run build`
   - Start command: `npm start` or use static server
   - Add env var: `REACT_APP_API_URL=<backend-url>`

## Environment Variables Summary

### Backend (.env)
```
PORT=10000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app
```

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Post-Deployment Checklist

- [ ] Backend health check working: `https://your-backend/health`
- [ ] Frontend loads without errors
- [ ] Can add new installations
- [ ] Can view installations in list
- [ ] Map displays correctly
- [ ] Can edit installations
- [ ] Can delete installations
- [ ] Geocoding works for addresses
- [ ] CORS configured correctly (no CORS errors in console)

## Troubleshooting

### CORS Errors
- Make sure `CLIENT_URL` in backend matches your exact frontend URL
- Check that frontend `REACT_APP_API_URL` matches backend URL
- Redeploy backend after changing environment variables

### Geocoding Not Working
- Check browser console for errors
- Nominatim may rate-limit requests
- Consider adding delay between requests or using API key

### Map Not Loading
- Check that Leaflet CSS is imported in `index.js`
- Verify installations have valid latitude/longitude values
- Check browser console for errors

### Data Loss
- JSON file storage is ephemeral on free tiers
- Consider migrating to database for production:
  - MongoDB Atlas (free tier)
  - Supabase (free tier)
  - PlanetScale (free tier)

## Upgrade to Database (Optional)

For production, consider replacing JSON storage with a database:

### MongoDB Setup
```bash
cd server
npm install mongodb mongoose
```

### PostgreSQL Setup
```bash
cd server
npm install pg
```

Then update your routes to use database queries instead of file operations.

## Custom Domain (Optional)

### Vercel
- Go to project settings → Domains
- Add your domain
- Update DNS records as instructed

### Render
- Go to service settings → Custom Domains
- Add your domain
- Update DNS records

## Monitoring & Analytics

Consider adding:
- **Sentry** for error tracking
- **Google Analytics** for usage stats
- **LogRocket** for session replay
- **Uptime monitoring** (UptimeRobot, Pingdom)

## Backup Strategy

1. **Manual Backups**
   - Download `installations.json` regularly
   - Store in cloud storage

2. **Automated Backups**
   - Add backup endpoint to API
   - Set up cron job to backup to S3/Cloud Storage

## Support

If you encounter issues:
1. Check deployment logs in Render/Vercel dashboard
2. Check browser console for frontend errors
3. Test API endpoints with Postman/curl
4. Verify environment variables are set correctly
