// Universal server configuration for both local and production environments
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - allows both local and remote clients
const getCorsOptions = () => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8080',
        'https://itch.io',
        'https://*.itch.io'
    ];

    // Add custom origins from environment variable
    if (process.env.CORS_ALLOWED_ORIGINS) {
        const customOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',');
        allowedOrigins.push(...customOrigins.map(o => o.trim()));
    }

    return {
        origin: function(origin, callback) {
            // Allow requests with no origin (mobile apps, curl requests, etc)
            if (!origin) return callback(null, true);

            // Check if origin matches any allowed pattern
            const isAllowed = allowedOrigins.some(allowed => {
                if (allowed === origin) return true;
                if (allowed.includes('*')) {
                    const pattern = allowed.replace(/\*/g, '.*');
                    return new RegExp(`^${pattern}$`).test(origin);
                }
                return false;
            });

            if (isAllowed) {
                callback(null, true);
            } else {
                // In production, log unfamiliar origins for debugging
                if (process.env.NODE_ENV === 'production') {
                    console.log('CORS request from origin:', origin);
                }
                callback(null, true); // Allow to be lenient, especially for itch.io
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
};

// Middleware
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Database abstraction layer
class DatabaseManager {
    constructor() {
        this.useDatabase = false;
        this.db = null;
        this.highScores = this.getDefaultHighScores();
    }

    getDefaultHighScores() {
        return [
            { player_name: 'ROBOT_RON', score: 75000, level_reached: 20, date_achieved: new Date().toISOString() },
            { player_name: 'CYBER_ACE', score: 62500, level_reached: 18, date_achieved: new Date().toISOString() },
            { player_name: 'NEON_KING', score: 49250, level_reached: 16, date_achieved: new Date().toISOString() },
            { player_name: 'PIXEL_WAR', score: 43600, level_reached: 15, date_achieved: new Date().toISOString() },
            { player_name: 'CODE_HERO', score: 38400, level_reached: 14, date_achieved: new Date().toISOString() },
            { player_name: 'RETRO_BOT', score: 32700, level_reached: 13, date_achieved: new Date().toISOString() },
            { player_name: 'ARCADE_X', score: 27150, level_reached: 12, date_achieved: new Date().toISOString() },
            { player_name: 'TECH_NOVA', score: 21600, level_reached: 11, date_achieved: new Date().toISOString() },
            { player_name: 'GAME_OVER', score: 16050, level_reached: 10, date_achieved: new Date().toISOString() },
            { player_name: 'PLAYER_1', score: 10500, level_reached: 9, date_achieved: new Date().toISOString() }
        ];
    }

    async initialize() {
        // Try to initialize database connection
        await this.tryConnectToDatabase();
        
        if (!this.useDatabase) {
            console.log('📝 Using in-memory storage for high scores');
        }
    }

    async tryConnectToDatabase() {
        try {
            // Only try MySQL if mysql2 is available
            const mysql = require('mysql2/promise');
            
            // Database configuration with environment variable support
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'robotron_game',
                connectTimeout: 5000, // 5 second timeout
                acquireTimeout: 5000,
                timeout: 5000
            };

            console.log('🔌 Attempting to connect to MySQL database...');

            // Connect to MySQL server (without specifying database)
            const connection = await mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                connectTimeout: dbConfig.connectTimeout
            });

            // Create database if it doesn't exist
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
            await connection.end();

            // Connect to the specific database
            this.db = await mysql.createConnection(dbConfig);

            // Create high_scores table if it doesn't exist
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS high_scores (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    player_name VARCHAR(50) NOT NULL,
                    score INT NOT NULL,
                    level_reached INT NOT NULL,
                    date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_score (score DESC)
                )
            `);

            // Load existing high scores from database
            await this.loadHighScoresFromDatabase();

            this.useDatabase = true;
            console.log('✅ Successfully connected to MySQL database');
            
        } catch (error) {
            console.log('⚠️  MySQL connection failed, falling back to in-memory storage');
            console.log('   Reason:', error.code || error.message);
            this.useDatabase = false;
        }
    }

    async loadHighScoresFromDatabase() {
        try {
            const [rows] = await this.db.execute(
                'SELECT player_name, score, level_reached, date_achieved FROM high_scores ORDER BY score DESC LIMIT 10'
            );
            
            if (rows.length > 0) {
                this.highScores = rows.map(row => ({
                    ...row,
                    date_achieved: row.date_achieved.toISOString()
                }));
                console.log(`📊 Loaded ${rows.length} high scores from database`);
            } else {
                // Insert default high scores into empty database
                await this.seedDatabase();
            }
        } catch (error) {
            console.error('Error loading high scores from database:', error);
        }
    }

    async seedDatabase() {
        try {
            console.log('🌱 Seeding database with default high scores...');
            for (const score of this.highScores) {
                await this.db.execute(
                    'INSERT INTO high_scores (player_name, score, level_reached) VALUES (?, ?, ?)',
                    [score.player_name, score.score, score.level_reached]
                );
            }
            console.log('✅ Database seeded successfully');
        } catch (error) {
            console.error('Error seeding database:', error);
        }
    }

    async getHighScores() {
        if (this.useDatabase) {
            try {
                const [rows] = await this.db.execute(
                    'SELECT player_name, score, level_reached, date_achieved FROM high_scores ORDER BY score DESC LIMIT 10'
                );
                return rows.map(row => ({
                    ...row,
                    date_achieved: row.date_achieved.toISOString()
                }));
            } catch (error) {
                console.error('Database error, falling back to memory:', error);
                this.useDatabase = false;
            }
        }
        
        // Return in-memory scores
        return this.highScores.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    async submitHighScore(playerName, score, levelReached) {
        const sanitizedName = playerName.substring(0, 20).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        const newScore = {
            player_name: sanitizedName,
            score: score,
            level_reached: levelReached,
            date_achieved: new Date().toISOString()
        };

        if (this.useDatabase) {
            try {
                // Remove any existing entries for this player with lower scores
                await this.db.execute(
                    'DELETE FROM high_scores WHERE player_name = ? AND score < ?',
                    [sanitizedName, score]
                );

                // Insert the new high score
                await this.db.execute(
                    'INSERT INTO high_scores (player_name, score, level_reached) VALUES (?, ?, ?)',
                    [sanitizedName, score, levelReached]
                );
            } catch (error) {
                console.error('Database insert error, falling back to memory:', error);
                this.useDatabase = false;
                // Fall through to memory storage
            }
        }

        if (!this.useDatabase) {
            // Remove any existing entries for this player with lower scores
            this.highScores = this.highScores.filter(entry => 
                !(entry.player_name === sanitizedName && entry.score < score)
            );

            // Add to in-memory storage
            this.highScores.push(newScore);
            this.highScores = this.highScores.sort((a, b) => b.score - a.score).slice(0, 10);
        }

        // Check if score made top 10
        const topScores = await this.getHighScores();
        const madeTopTen = topScores.some(entry => 
            entry.player_name === sanitizedName && entry.score === score
        );

        return { success: true, madeTopTen };
    }

    getStorageMode() {
        return this.useDatabase ? 'mysql' : 'memory';
    }
}

// Initialize database manager
const dbManager = new DatabaseManager();

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        mode: dbManager.getStorageMode(),
        timestamp: new Date().toISOString()
    });
});

// Get top high scores
app.get('/api/high-scores', async (req, res) => {
    try {
        const scores = await dbManager.getHighScores();
        res.json(scores);
    } catch (error) {
        console.error('Error fetching high scores:', error);
        res.status(500).json({ error: 'Failed to fetch high scores' });
    }
});

// Alternative endpoint name
app.get('/api/highscores', async (req, res) => {
    try {
        const scores = await dbManager.getHighScores();
        res.json(scores);
    } catch (error) {
        console.error('Error fetching high scores:', error);
        res.status(500).json({ error: 'Failed to fetch high scores' });
    }
});

// Submit new high score
app.post('/api/submit-score', async (req, res) => {
    try {
        const { playerName, score, levelReached } = req.body;

        // Validate input
        if (!playerName || typeof score !== 'number' || typeof levelReached !== 'number') {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        if (score < 0 || levelReached < 1) {
            return res.status(400).json({ error: 'Invalid score or level values' });
        }

        const result = await dbManager.submitHighScore(playerName, score, levelReached);
        
        res.json({
            ...result,
            message: result.madeTopTen ? 'Congratulations! You made the top 10!' : 'Score recorded!',
            storageMode: dbManager.getStorageMode()
        });

    } catch (error) {
        console.error('Error submitting high score:', error);
        res.status(500).json({ error: 'Failed to submit high score' });
    }
});

// Alternative endpoint name
app.post('/api/highscores', async (req, res) => {
    try {
        const { playerName, score, levelReached } = req.body;

        // Validate input
        if (!playerName || typeof score !== 'number' || typeof levelReached !== 'number') {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        if (score < 0 || levelReached < 1) {
            return res.status(400).json({ error: 'Invalid score or level values' });
        }

        const result = await dbManager.submitHighScore(playerName, score, levelReached);
        
        res.json({
            ...result,
            message: result.madeTopTen ? 'Congratulations! You made the top 10!' : 'Score recorded!',
            storageMode: dbManager.getStorageMode()
        });

    } catch (error) {
        console.error('Error submitting high score:', error);
        res.status(500).json({ error: 'Failed to submit high score' });
    }
});

// Serve the main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    await dbManager.initialize();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🎮 Game available at: http://localhost:${PORT}`);
        console.log(`💾 Storage mode: ${dbManager.getStorageMode()}`);
        console.log('');
    });
}

startServer().catch(console.error);
