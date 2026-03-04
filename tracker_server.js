/**
 * Bike Tracker Backend - Enterprise Edition
 * Features: Real-time GPS tracking & Critical Security Alerting.
 * Author: Shahar
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios'); // Added for external API communication

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route: Main Dashboard
 * Injects Google Maps API key dynamically.
 */
app.get('/', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'public', 'tracker_index.html');
        const data = await fs.readFile(filePath, 'utf8');
        const apiKey = process.env.MAPS_API_KEY || "MISSING_KEY";
        const renderedData = data.replace('__GOOGLE_MAPS_API_KEY__', apiKey);
        res.status(200).send(renderedData);
    } catch (err) {
        res.status(500).send("Error loading dashboard.");
    }
});

/**
 * Endpoint: Security Alert (Critical)
 * Triggered by hardware motion sensor to bypass silent mode.
 */
app.post('/api/alert', async (req, res) => {
    console.log("🚨 SECURITY ALERT: Unauthorized movement detected!");

    const pushoverUrl = 'https://api.pushover.net/1/messages.json';
    const alertData = {
        token: process.env.PUSHOVER_APP_TOKEN,
        user: process.env.PUSHOVER_USER_KEY,
        title: "Bike Security System",
        message: "⚠️ WARNING: Your bike is being moved!",
        priority: 2,      // Level 2 = Critical Alert (Bypasses DND)
        retry: 30,        // Retry every 30 seconds
        expire: 3600,     // Expire after 1 hour
        sound: "siren"    // High-volume alarm sound
    };

    try {
        // Dispatch to Pushover API
        await axios.post(pushoverUrl, alertData);
        
        // Notify web dashboard in real-time
        io.emit('securityBreach', { status: 'ALARM', timestamp: new Date() });
        
        res.status(200).json({ status: "Alert dispatched successfully" });
    } catch (error) {
        console.error("Alert System Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to send critical alert" });
    }
});

/**
 * Endpoint: Standard Location Update
 * Receives regular GPS pings from LilyGo T-SIM7000G.
 */
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).send("Invalid coordinates");

    io.emit('locationUpdate', { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng), 
        timestamp: new Date() 
    });
    
    res.status(200).send("Location synced");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Active on Port ${PORT}`);
});
