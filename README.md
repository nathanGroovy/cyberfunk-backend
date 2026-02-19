# CYBERFUNK OVERDRIVE - Backend Server

High scores leaderboard backend API for CYBERFUNK OVERDRIVE arcade game.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cyberfunk-backend.git
cd cyberfunk-backend

# Install dependencies
npm install

# Start the server (in-memory, no database needed)
npm start
```

Server will run on `http://localhost:3000`

## Server Options

### Option 1: Simple In-Memory Server (Recommended for Quick Start)

**Best for:** Testing, development, free tier hosting (scores reset monthly)

```bash
npm start
```

Features:
- ✅ No database setup needed
- ✅ Works immediately
- ✅ Perfect for itch.io free tier hosting
- ✅ Scores persist until server restart (~1 month on free Render tier)

### Option 2: MySQL Database Server

**Best for:** Production, persistent high scores, dedicated database

```bash
# Set up database (MySQL 5.7+ or MariaDB)
mysql -u root -p < database/database.sql

# Configure .env file
cp .env.example .env
# Edit .env and add your MySQL credentials

# Start server with database
npm start
```

Environment variables needed:
```env
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-password
DB_NAME=robotron_game
```

## Deployment

### Render.com (Recommended - FREE Tier)

1. **Sign up and connect GitHub**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Deploy**
   - New → Web Service
   - Select this repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: Choose closest to you
   - Create Web Service

3. **Get your URL**
   - Your API will be at: `https://your-service-name.onrender.com`
   - Use this URL in your game's `index.html` meta tag

### Alternative: Railway

1. Sign up at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add MySQL plugin (optional)
4. Deploy

**Note:** Railway now charges $5-15/month. Use Render for free tier.

### Self-Hosted VPS

Deploy on any Node.js hosting:
- DigitalOcean
- Linode
- AWS EC2
- Azure Virtual Machines

```bash
# On your server:
git clone <your-repo>
cd cyberfunk-backend
npm install
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "mode": "memory",
  "timestamp": "2024-02-18T12:00:00.000Z"
}
```

### Get High Scores
```
GET /api/high-scores
```

Response:
```json
[
  {
    "player_name": "ROBOT_RON",
    "score": 75000,
    "level_reached": 20,
    "date_achieved": "2024-02-18T12:00:00.000Z"
  },
  ...
]
```

### Submit High Score
```
POST /api/submit-score
Content-Type: application/json

{
  "playerName": "PLAYER_NAME",
  "score": 50000,
  "levelReached": 15
}
```

Response:
```json
{
  "success": true,
  "madeTopTen": true,
  "message": "Congratulations! You made the top 10!",
  "storageMode": "memory"
}
```

## Configuration

### CORS Setup

By default, server allows requests from:
- `localhost:3000`, `localhost:8000`, `localhost:8080`
- `*.itch.io` (all itch.io domains)

To add more origins, set in `.env`:
```env
CORS_ALLOWED_ORIGINS=https://example.com,https://another-site.com
```

## Development

### Local Testing

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Test the API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/high-scores
```

### With Database

```bash
# Install MySQL locally (or use Docker)
# Start MySQL service
# Configure .env with local credentials
npm start
```

### Hot Reload Development

```bash
npm run dev
```

Requires `nodemon` (included in devDependencies).

## Database Schema

### high_scores Table

```sql
CREATE TABLE high_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    level_reached INT NOT NULL,
    date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_score (score DESC)
);
```

Sample data is in `database/database.sql`.

## Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=4000 npm start

# Or kill process using 3000
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -i :3000
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Solution:
- Make sure MySQL is running
- Check credentials in `.env`
- Or use in-memory mode (remove DB_HOST from .env)

### CORS Errors
If you see:
```
CORS policy: Response to preflight request doesn't pass access control
```

Solution:
- Check `CORS_ALLOWED_ORIGINS` in `.env`
- Add your game's domain to the allowed list
- Restart server after changing

### Scores Not Persisting
- In-memory mode: Scores reset when server restarts
- In-memory on free tier: Resets approximately monthly
- Solution: Use MySQL database for permanent storage

## Configuration for itch.io

1. **Deploy this backend** to Render or your hosting
2. **Get public URL** (e.g., `https://cyberfunk-api.onrender.com`)
3. **In game's `index.html`**, add:
```html
<meta name="leaderboard-api" content="https://cyberfunk-api.onrender.com">
```

4. **Upload game to itch.io** with updated `index.html`

The game will automatically use your backend for leaderboards.

## Monitoring

### Check Server Status
```bash
curl https://your-domain.onrender.com/api/health
```

### View Recent High Scores
```bash
curl https://your-domain.onrender.com/api/high-scores
```

### Monitor Logs
- **Render:** Check Logs tab in dashboard
- **Railway:** Check Deployments tab
- **Self-hosted:** `npm start` shows console output

## Performance

### Memory Usage
- In-memory mode: ~2-5 MB per 1000 scores
- With MySQL: Depends on database size

### Response Time
- Health check: <10ms
- Get high scores: <50ms (in-memory), <100ms (database)
- Submit score: <100ms (in-memory), <200ms (database)

### Scaling

For high traffic (1000+ players/day):
1. Use MySQL database for better scaling
2. Add caching layer (Redis)
3. Consider database read replicas

## Security Notes

✅ **Implemented:**
- Input validation
- Name sanitization
- CORS protection
- Rate limiting support

⚠️ **Not Implemented:**
- Authentication (anyone can submit scores)
- Request signing (vulnerable to cheating)
- DDoS protection (use Cloudflare)

For production, consider:
- Implement player authentication
- Add request signing for score submission
- Use Cloudflare for DDoS protection
- Monitor for suspicious score patterns

## License

MIT - See LICENSE file

## Support

- **Documentation:** See README.md
- **Issues:** Check GitHub issues
- **Deployment Help:** See DEPLOYMENT.md in main game repo

## Credits

CYBERFUNK OVERDRIVE Backend Server
Part of CYBERFUNK OVERDRIVE arcade game
