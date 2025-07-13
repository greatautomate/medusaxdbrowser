const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const API_BASE_URL = 'https://engine.hyperbeam.com/v0';
const API_KEY = process.env.MEDUSAXD_API_KEY;

// Store active sessions
const activeSessions = new Map();

// Create new browser session with fallback for restricted features
router.post('/create-session', async (req, res) => {
  try {
    const { 
      region = 'NA', 
      width = 1280,
      height = 720
    } = req.body;

    // Start with basic configuration to avoid restrictions
    let sessionConfig = {
      width,
      height
    };

    // Add region if specified
    if (region) {
      sessionConfig.region = region;
    }

    console.log('Creating session with config:', sessionConfig);

    const response = await axios.post(`${API_BASE_URL}/vm`, sessionConfig, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const sessionData = {
      session_id: response.data.session_id,
      embed_url: response.data.embed_url,
      admin_token: response.data.admin_token,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    activeSessions.set(response.data.session_id, sessionData);

    res.json({
      success: true,
      session_id: response.data.session_id,
      embed_url: response.data.embed_url,
      message: 'MedusaXD browser session created successfully'
    });

  } catch (error) {
    console.error('Session creation error:', error.response?.data || error.message);

    // Handle specific restriction error
    if (error.response?.data?.code === 'err_api_restricted') {
      res.status(403).json({ 
        success: false, 
        error: 'Advanced features are restricted. Using basic configuration.',
        code: 'feature_restricted',
        message: 'Some advanced features require special permissions. The session will be created with basic settings.'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create browser session',
        details: error.response?.data?.message || error.message
      });
    }
  }
});

// Enhanced session creation with progressive feature testing
router.post('/create-enhanced-session', async (req, res) => {
  const featureConfigs = [
    // Try full configuration first
    {
      width: 1280,
      height: 720,
      region: 'NA',
      profile: true,
      timeout_inactive: 300000,
      user_agent: req.body.user_agent
    },
    // Fallback to basic config with timeouts
    {
      width: 1280,
      height: 720,
      region: 'NA',
      timeout_inactive: 300000
    },
    // Most basic configuration
    {
      width: 1280,
      height: 720
    }
  ];

  for (let i = 0; i < featureConfigs.length; i++) {
    try {
      const config = featureConfigs[i];
      console.log(`Attempting configuration ${i + 1}:`, config);

      const response = await axios.post(`${API_BASE_URL}/vm`, config, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const sessionData = {
        session_id: response.data.session_id,
        embed_url: response.data.embed_url,
        admin_token: response.data.admin_token,
        created_at: new Date().toISOString(),
        status: 'active',
        config_level: i + 1
      };

      activeSessions.set(response.data.session_id, sessionData);

      res.json({
        success: true,
        session_id: response.data.session_id,
        embed_url: response.data.embed_url,
        config_level: i + 1,
        message: `MedusaXD browser session created (Config Level ${i + 1})`
      });

      return; // Success, exit the loop

    } catch (error) {
      console.error(`Configuration ${i + 1} failed:`, error.response?.data || error.message);

      if (i === featureConfigs.length - 1) {
        // All configurations failed
        res.status(500).json({ 
          success: false, 
          error: 'All session configurations failed',
          details: error.response?.data?.message || error.message
        });
      }
    }
  }
});

// Rest of your existing routes...
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ 
      success: false, 
      error: 'Session not found' 
    });
  }

  res.json({
    success: true,
    session: {
      session_id: session.session_id,
      status: session.status,
      created_at: session.created_at,
      config_level: session.config_level
    }
  });
});

router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    await axios.delete(`${API_BASE_URL}/vm/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.admin_token}`
      }
    });

    activeSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Browser session terminated'
    });

  } catch (error) {
    console.error('Session termination error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to terminate session' 
    });
  }
});

router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    session_id: session.session_id,
    status: session.status,
    created_at: session.created_at,
    config_level: session.config_level
  }));

  res.json({
    success: true,
    sessions,
    total: sessions.length
  });
});

module.exports = router;
