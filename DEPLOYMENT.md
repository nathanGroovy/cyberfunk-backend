# Backend Deployment Guide

Complete instructions for deploying CYBERFUNK OVERDRIVE backend.

## Quick Comparison

| Platform | Cost | Setup | Database | Best For |
|----------|------|-------|----------|----------|
| **Render** | FREE | 5 min | In-memory (free) or Postgres (free) | ⭐ Recommended |
| **Railway** | $5-15/mo | 5 min | MySQL included | High traffic |
| **Vercel** | FREE | 5 min | Serverless (limited) | Simple API |
| **Self-Hosted** | $5-50/mo | 30+ min | Any | Full control |

## Option 1: Render.com (Recommended - FREE)

### Step 1: Sign Up
1. Go to [render.com](https://render.com)
2. Sign in with GitHub (easiest)
3. Authorize Render to access your repositories

### Step 2: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit - backend server"
git remote add origin https://github.com/yourusername/cyberfunk-backend.git
git branch -M main
git push -u origin main
```

### Step 3: Create Web Service
1. In Render dashboard, click "New+"
2. Select "Web Service"
3. Connect to your GitHub repository
4. Select `cyberfunk-backend` repo

### Step 4: Configure
```
Name: cyberfunk-api (or your preferred name)
Environment: Node
Region: Select closest to you
Branch: main
Build Command: npm install
Start Command: npm start
Plan: Free
```

### Step 5: Deploy
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- You'll get URL like: `https://cyberfunk-api.onrender.com`

### Step 6: Configure CORS
1. In Render dashboard, go to Environment
2. Add variable: `CORS_ALLOWED_ORIGINS=https://yourname.itch.io`
3. Redeploy

### Step 7: Update Game
In your game's `index.html`:
```html
<meta name="leaderboard-api" content="https://cyberfunk-api.onrender.com">
```

**Done!** Your backend is live.

---

## Option 2: Railway (Paid - $5-15/month)

### Step 1: Sign Up
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Create new project

### Step 2: Deploy
1. Connect your GitHub repository
2. Railway auto-detects Node.js
3. Deploys automatically

### Step 3: Get URL
- In Railway dashboard, go to Deployments
- Copy the URL shown

### Step 4: Update Game
```html
<meta name="leaderboard-api" content="https://your-railway-url.railway.app">
```

**Note:** Railway now requires credit card and charges $5/month minimum. Use Render instead.

---

## Option 3: Vercel (Free Serverless)

### Step 1: Connect GitHub
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository

### Step 2: Configure
```
Framework: Other (Node.js)
Build Command: npm install
Output Directory: ./server
```

### Step 3: Deploy
- Click "Deploy"
- Get URL like: `https://cyberfunk-api.vercel.app`

**Limitations:**
- Function timeout: 10 seconds (might be too short for requests)
- Cold starts: First request takes 1-2 seconds
- Best for simple APIs only

---

## Option 4: Self-Hosted (DigitalOcean, AWS, etc.)

### DigitalOcean (Recommended - $4-12/month)

#### Step 1: Create Droplet
1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Create → Droplet
3. OS: Ubuntu 22.04
4. Size: Basic ($4/month for hobby project)

#### Step 2: SSH to Droplet
```bash
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Git
apt install -y git

# Install PM2 (process manager)
npm install -g pm2
```

#### Step 3: Deploy Code
```bash
cd /home
git clone https://github.com/yourusername/cyberfunk-backend.git
cd cyberfunk-backend
npm install
npm start
```

#### Step 4: Set Up PM2 (Keep Server Running)
```bash
# Start with PM2
pm2 start server/server-universal.js --name "cyberfunk-api"

# Auto-restart on reboot
pm2 startup
pm2 save
```

#### Step 5: Set Up Domain (Optional)
1. Get domain from Namecheap, GoDaddy, etc.
2. Point to Droplet IP
3. Use Nginx as reverse proxy

```bash
# Install Nginx
apt install -y nginx

# Create config
nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Restart Nginx
systemctl restart nginx

# Get SSL (free with Let's Encrypt)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

#### Step 6: Update Game
```html
<meta name="leaderboard-api" content="https://your-domain.com">
```

---

## Environment Variables Reference

### For In-Memory Mode (No Database)
```env
NODE_ENV=production
PORT=3000
```

### For MySQL Database
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-database-host
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=robotron_game
```

### For Render with PostgreSQL
```env
POSTGRES_URL=postgresql://user:pass@host/db
```

### CORS Configuration
```env
CORS_ALLOWED_ORIGINS=https://yourname.itch.io,https://your-domain.com
```

---

## Database Setup

### MySQL (Local Development)
```bash
# Install MySQL
# Mac: brew install mysql
# Windows: Download installer
# Linux: apt install mysql-server

# Run setup script
mysql -u root -p < database/database.sql

# Configure .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=robotron_game
```

### PostgreSQL (Render offers free tier)
```sql
-- Create database and table
CREATE DATABASE robotron_game;

CREATE TABLE high_scores (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    level_reached INTEGER NOT NULL,
    date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_score ON high_scores(score DESC);
```

---

## Testing Deployment

### Test Health Check
```bash
curl https://your-api-url.com/api/health
```

Expected response:
```json
{
    "status": "OK",
    "message": "Server is running",
    "mode": "memory",
    "timestamp": "2024-02-18T12:00:00.000Z"
}
```

### Test Get Scores
```bash
curl https://your-api-url.com/api/high-scores
```

### Test Submit Score
```bash
curl -X POST https://your-api-url.com/api/submit-score \
  -H "Content-Type: application/json" \
  -d '{"playerName":"TEST","score":50000,"levelReached":15}'
```

---

## Troubleshooting

### Build Fails
```
npm ERR! code ENOENT
npm ERR! errno -2
npm ERR! syscall open
npm ERR! File not found
```

Solution: Make sure package.json exists and is valid.

### Runtime Error
```
Error: Cannot find module 'express'
```

Solution:
- Rebuild command includes: `npm install`
- Check node_modules are not in .gitignore blocking installs

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```

Solution:
1. Check `CORS_ALLOWED_ORIGINS` environment variable
2. Add your game domain to the list
3. Redeploy/restart server

### Cold Start Delay
If using Vercel/serverless and first request takes 5+ seconds:
- Use Render instead (always-on)
- Or use dedicated server

### Database Connection Timeout
```
Error: connect ECONNREFUSED
```

Solution:
1. Check database credentials in .env
2. Verify database is running
3. Check network/firewall rules
4. Use in-memory mode if database unavailable

---

## Monitoring

### Render Dashboard
- Check "Metrics" tab for CPU/memory usage
- View "Logs" for error messages
- Monitor "Events" for deployments

### Self-Hosted
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs cyberfunk-api

# Monitor resources
htop
```

---

## Upgrading

### Domain Migration
1. Update all game files with new URL
2. Redeploy game to itch.io
3. Update DNS records if using domain

### Database Migration (In-Memory to MySQL)
1. Upgrade to paid tier with database
2. Export in-memory scores (if needed)
3. Update DB_* variables
4. Restart server

### Scaling
- Render free tier: ~1000 requests/day
- For higher: Upgrade plan or use dedicated server

---

## Cost Summary

| Option | Monthly Cost | Setup Time | Recommendation |
|--------|-------------|------------|-----------------|
| Render Free | **$0** | 5 min | ⭐ Start here |
| DigitalOcean | $4-12 | 30 min | Good for learning |
| Railway | $5-15 | 5 min | For high traffic |
| Self-Hosted VPS | $5-50 | 1 hour | Full control |

**Recommendation:** Start with Render free tier. Upgrade only if you need premium features.

---

## Next Steps

1. **Deploy backend** using one of the options above
2. **Get API URL** (e.g., `https://cyberfunk-api.onrender.com`)
3. **Update game** with new backend URL in `index.html`
4. **Upload to itch.io** with updated game files
5. **Test** by playing game and submitting a score

See main README.md for more details.
