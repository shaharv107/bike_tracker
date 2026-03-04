/**
 * Bike Tracker Backend Service
 * Features: Real-time GPS mapping, Socket.io integration, and Critical Security Alerts.
 * * This service is designed to bridge IoT hardware (LilyGo T-SIM7000G) with a web-based
 * monitoring dashboard and mobile notification services.
 * * Author: Shahar
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios'); // Required for external API requests to Pushover

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Middleware Configuration ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route: Main Dashboard
 * Serves the tracker UI and dynamically injects the Google Maps API key.
 * This pattern protects the API key from being hardcoded in Git.
 */
app.get('/', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'public', 'tracker_index.html');
        const content = await fs.readFile(filePath, 'utf8');
        
        // Inject key from Render Environment Variables
        const apiKey = process.env.MAPS_API_KEY || "MISSING_KEY";
        const modifiedContent = content.replace('__GOOGLE_MAPS_API_KEY__', apiKey);
        
        res.status(200).set('Content-Type', 'text/html').send(modifiedContent);
    } catch (err) {
        console.error("Critical: Failed to load index file.", err);
        res.status(500).send("Server Error - View logs for details.");
    }
});

/**
 * Endpoint: Security Alert (Critical Priority)
 * Triggers a mobile notification that bypasses 'Do Not Disturb' mode.
 * * @param {object} req - Contains alert metadata (optional)
 */
app.post('/api/alert', async (req, res) => {
    console.log("🚨 [SECURITY EVENT] Unauthorized movement detected. Dispatching critical alert...");

    const pushoverEndpoint = 'https://api.pushover.net/1/messages.json';
    const alertPayload = {
        token: process.env.PUSHOVER_APP_TOKEN,
        user: process.env.PUSHOVER_USER_KEY,
        title: "🚨 BIKE SECURITY ALERT",
        message: "CRITICAL: Unauthorized movement detected! Your bike is potentially being moved.",
        priority: 2,       // Level 2 = Emergency Priority (Bypasses Silent/DND)
        retry: 30,         // Resend notification every 30 seconds until acknowledged
        expire: 3600,      // Notification expires after 1 hour
        sound: "MyAlertSound"     // High-intensity alarm sound
    };

    try {
        // Dispatch to Pushover API
        await axios.post(pushoverEndpoint, alertPayload);
        
        // Push real-time event to all connected web clients
        io.emit('securityBreach', { status: 'ALARM_TRIGGERED', timestamp: new Date() });
        
        console.log("✅ [SUCCESS] Critical alert sent to user device.");
        res.status(200).json({ status: "Alert dispatched successfully" });
    } catch (error) {
        console.error("❌ [FAILURE] Alert system failed:", error.message);
        res.status(500).json({ error: "Failed to dispatch notification service." });
    }
});

/**
 * Endpoint: Location Synchronization
 * Receives GPS data from hardware and broadcasts to dashboard.
 */
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: "Invalid data: Lat and Lng required." });
    }

    const payload = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timestamp: new Date().toISOString()
    };

    io.emit('locationUpdate', payload);
    console.log(`[GPS Update] Lat: ${lat}, Lng: ${lng}`);
    
    res.status(200).json({ status: "success" });
});

// --- Server Startup ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================`);
    console.log(`Bike Tracker Server is LIVE on Port ${PORT}`);
    console.log(`Security Protocol: Critical Alerts ACTIVE`);
    console.log(`================================================`);
});

