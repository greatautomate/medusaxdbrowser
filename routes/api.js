
const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const API_BASE_URL = "https://engine.hyperbeam.com/v0";
const API_KEY = process.env.MEDUSAXD_API_KEY;

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map();

// Create new browser session
router.post("/create-session", async (req, res) => {
  try {
    const { 
      profile = false, 
      region = "NA", 
      user_agent,
      timeout_absolute,
      timeout_inactive,
      width = 1280,
      height = 720
    } = req.body;

    const sessionConfig = {
      profile,
      region,
      width,
      height
    };

    if (user_agent) sessionConfig.user_agent = user_agent;
    if (timeout_absolute) sessionConfig.timeout_absolute = timeout_absolute;
    if (timeout_inactive) sessionConfig.timeout_inactive = timeout_inactive;

    const response = await axios.post(`${API_BASE_URL}/vm`, sessionConfig, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const sessionData = {
      session_id: response.data.session_id,
      embed_url: response.data.embed_url,
      admin_token: response.data.admin_token,
      created_at: new Date().toISOString(),
      status: "active"
    };

    activeSessions.set(response.data.session_id, sessionData);

    res.json({
      success: true,
      session_id: response.data.session_id,
      embed_url: response.data.embed_url,
      message: "MedusaXD browser session created successfully"
    });

  } catch (error) {
    console.error("Session creation error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create browser session" 
    });
  }
});

// Get session status
router.get("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ 
      success: false, 
      error: "Session not found" 
    });
  }

  res.json({
    success: true,
    session: {
      session_id: session.session_id,
      status: session.status,
      created_at: session.created_at
    }
  });
});

// Terminate session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: "Session not found" 
      });
    }

    await axios.delete(`${API_BASE_URL}/vm/${sessionId}`, {
      headers: {
        "Authorization": `Bearer ${session.admin_token}`
      }
    });

    activeSessions.delete(sessionId);

    res.json({
      success: true,
      message: "Browser session terminated"
    });

  } catch (error) {
    console.error("Session termination error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to terminate session" 
    });
  }
});

// List active sessions
router.get("/sessions", (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    session_id: session.session_id,
    status: session.status,
    created_at: session.created_at
  }));

  res.json({
    success: true,
    sessions,
    total: sessions.length
  });
});

module.exports = router;

