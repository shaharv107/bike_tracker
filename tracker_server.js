/**
 * Bike Tracker Backend
 * Real-time GPS tracking system utilizing Node.js, Socket.io, and Express.
 * Designed to interface with LilyGo T-SIM7000G hardware via REST API.

 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises; // Using promises for cleaner async/await flow

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// --- Middleware Configuration ---
app.use(cors());
app.use(bodyParser.json());
// Serve static assets (CSS, JS, Images) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Main Route: Serves the tracking dashboard.
 * Dynamically injects the Google Maps API Key from Environment Variables.
 */
app.get('/', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'public', 'tracker_index.html');
        const data = await fs.readFile(filePath, 'utf8');

        // Fetching API Key from Render environment variables
        const apiKey = process.env.MAPS_API_KEY || "MISSING_KEY";
        
        // Injecting the key into the placeholder within the HTML file
        const renderedData = data.replace('__GOOGLE_MAPS_API_KEY__', apiKey);
        
        res.status(200).send(renderedData);
    } catch (err) {
        console.error("Critical Error: Failed to serve dashboard.", err);
        res.status(500).send("Internal Server Error - Check server logs.");
    }
});

/**
 * IoT Endpoint: Receives location data from hardware clients (e.g., LilyGo T-SIM7000G).
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 */
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    
    // Basic validation of incoming coordinates
    if (!lat || !lng) {
        return res.status(400).json({ error: "Invalid payload: Latitude and Longitude are required." });
    }

    const locationUpdate = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timestamp: new Date().toISOString()
    };

    // Logging transmission for debugging
    console.log(`[IoT Update] Received Data: Lat ${lat}, Lng ${lng}`);
    
    // Broadcast the update to all connected Web clients via Socket.io
    io.emit('locationUpdate', locationUpdate);
    
    res.status(200).json({ status: "success", message: "Location updated successfully" });
});

// --- Server Lifecycle ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`Bike Tracker Server is operational on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Security: API Key dynamic injection is active`);
    console.log(`==================================================`);
});
