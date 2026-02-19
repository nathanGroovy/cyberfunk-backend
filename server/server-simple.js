// Simplified Node.js Express server for high scores (no database required)
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// In-memory high scores storage (fallback when no database)
let highScores = [
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

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', mode: 'in-memory' });
});

// Get top high scores
app.get('/api/high-scores', (req, res) => {
    try {
        // Sort by score descending and return top 10
        const sortedScores = highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        res.json(sortedScores);
    } catch (error) {
        console.error('Error fetching high scores:', error);
        res.status(500).json({ error: 'Failed to fetch high scores' });
    }
});

// Alternative endpoint name
app.get('/api/highscores', (req, res) => {
    try {
        const sortedScores = highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        res.json(sortedScores);
    } catch (error) {
        console.error('Error fetching high scores:', error);
        res.status(500).json({ error: 'Failed to fetch high scores' });
    }
});

// Submit new high score
app.post('/api/submit-score', (req, res) => {
    try {
        const { playerName, score, levelReached } = req.body;

        // Validate input
        if (!playerName || typeof score !== 'number' || typeof levelReached !== 'number') {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Limit player name length and sanitize
        const sanitizedName = playerName.substring(0, 20).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

        // Create new score entry
        const newScore = {
            player_name: sanitizedName,
            score: score,
            level_reached: levelReached,
            date_achieved: new Date().toISOString()
        };

        // Add to high scores
        highScores.push(newScore);

        // Sort by score and keep only top 10
        highScores = highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Check if this score made it to top 10
        const madeTopTen = highScores.some(entry => 
            entry.player_name === sanitizedName && entry.score === score
        );

        res.json({ 
            success: true, 
            madeTopTen,
            message: madeTopTen ? 'Congratulations! You made the top 10!' : 'Score recorded!'
        });

    } catch (error) {
        console.error('Error submitting high score:', error);
        res.status(500).json({ error: 'Failed to submit high score' });
    }
});

// Alternative endpoint name
app.post('/api/highscores', (req, res) => {
    try {
        const { playerName, score, levelReached } = req.body;

        if (!playerName || typeof score !== 'number' || typeof levelReached !== 'number') {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        const sanitizedName = playerName.substring(0, 20).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        const newScore = {
            player_name: sanitizedName,
            score: score,
            level_reached: levelReached,
            date_achieved: new Date().toISOString()
        };

        highScores.push(newScore);
        highScores = highScores.sort((a, b) => b.score - a.score).slice(0, 10);

        const madeTopTen = highScores.some(entry => 
            entry.player_name === sanitizedName && entry.score === score
        );

        res.json({ 
            success: true, 
            madeTopTen,
            message: madeTopTen ? 'Congratulations! You made the top 10!' : 'Score recorded!'
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simplified High Scores Server running on http://localhost:${PORT}`);
    console.log(`📊 Using in-memory storage (no database required)`);
    console.log(`🎮 Game available at: http://localhost:${PORT}`);
    console.log(`📈 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`\n✅ Server ready! You can now play the game with working high scores.`);
});

module.exports = app;
