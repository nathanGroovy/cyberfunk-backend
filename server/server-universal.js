const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins for deployed version (requests with no origin are fine too)
    // This is safe because the API only stores scores, no sensitive operations
    callback(null, true);
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handle preflight requests
app.options('*', cors(corsOptions));

// ✅ GET - Fetch all high scores
app.get('/api/high-scores', async (req, res) => {
  try {
    console.log('Fetching high scores...');
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);

    if (error) throw error;

    console.log(`Returning ${data.length} scores`);
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores', details: error.message });
  }
});

// ✅ POST - Submit new high score
app.post('/api/high-scores', async (req, res) => {
  try {
    const { playerName, score, levelReached } = req.body;

    console.log(`Received score submission: ${playerName} - ${score}`);

    // Validation
    if (!playerName || score === undefined) {
      return res.status(400).json({ error: 'Missing playerName or score' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // Filter and sanitize name
    const filteredName = playerName
      .substring(0, 50)
      .toUpperCase()
      .replace(/[^A-Z0-9_\s-]/g, '_')
      .trim();

    if (!filteredName) {
      return res.status(400).json({ error: 'Invalid player name' });
    }

    // Check for all scores (will do case-insensitive match client-side)
    const { data: allExistingScores, error: fetchError } = await supabase
      .from('high_scores')
      .select('id, score, player_name')
      .order('score', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching existing scores:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Total scores in database: ${allExistingScores?.length || 0}`);
    if (allExistingScores && allExistingScores.length > 0) {
      console.log(`📋 Sample scores: ${allExistingScores.slice(0, 5).map(s => `${s.player_name}(${s.score})`).join(', ')}`);
    }

    // Helper function to sanitize names for comparison (same as initial sanitization)
    const sanitizeName = (name) => {
      return (name || '')
        .substring(0, 50)
        .toUpperCase()
        .replace(/[^A-Z0-9_\s-]/g, '_')
        .trim();
    };

    console.log(`🔍 Looking for matches for: "${playerName}" → sanitized to: "${filteredName}"`);

    // Find ALL scores for this player (sanitize both old and new names for comparison)
    const matchingScores = allExistingScores
      ? allExistingScores.filter(s => {
          const oldSanitized = sanitizeName(s.player_name);
          const isMatch = oldSanitized === filteredName;
          if (isMatch || allExistingScores.length <= 10) {
            console.log(`  "${s.player_name}" → "${oldSanitized}" [${isMatch ? '✅ MATCH' : '❌'}]`);
          }
          return isMatch;
        })
      : [];

    console.log(`✔️ Found ${matchingScores.length} existing scores for player "${filteredName}"`);

    // If player has any existing scores, check if new score is higher
    if (matchingScores.length > 0) {
      // Get the highest existing score
      const highestExisting = Math.max(...matchingScores.map(s => s.score));
      
      if (score <= highestExisting) {
        console.log(`❌ New score ${score} not higher than existing ${highestExisting}`);
        return res.status(400).json({
          success: false,
          error: `Your existing score of ${highestExisting} is higher!`,
          madeTopTen: false
        });
      }
      
      // Delete ALL old scores for this player before adding the new one
      console.log(`🗑️  Attempting to delete ${matchingScores.length} old score(s) for "${filteredName}"...`);
      for (const oldScore of matchingScores) {
        console.log(`  → Deleting ID ${oldScore.id}: ${oldScore.player_name} (${oldScore.score})`);
        const { error: deleteError } = await supabase
          .from('high_scores')
          .delete()
          .eq('id', oldScore.id);
        
        if (deleteError) {
          console.error(`❌ FAILED to delete score ID ${oldScore.id}:`, deleteError);
          throw deleteError;
        }
        console.log(`  ✅ Successfully deleted ID ${oldScore.id}`);
      }
    }

    // Insert the new score
    const { data, error } = await supabase
      .from('high_scores')
      .insert({
        player_name: filteredName,
        score: Math.floor(score),
        level_reached: levelReached || 0
      })
      .select();

    if (error) throw error;

    // Check if made the leaderboard (top 100)
    const { data: allScores, error: rankError } = await supabase
      .from('high_scores')
      .select('id')
      .order('score', { ascending: false })
      .limit(100);

    const madeTopTen = allScores && allScores.length <= 100;

    res.json({
      success: true,
      message: 'Score submitted!',
      madeTopTen: madeTopTen,
      data: data[0]
    });

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// ✅ GET - Fetch top scores with ranking
app.get('/api/high-scores/top/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Add ranking
    const ranked = data.map((score, index) => ({
      ...score,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
});
