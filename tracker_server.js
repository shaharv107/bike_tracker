const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

// דף הבית - טעינת הממשק של המעקב
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracker_index.html'));
});

// Endpoint לקבלת נתונים מה-LilyGo או מ-curl
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).send("Missing coordinates");
    
    console.log(`Received: Lat ${lat}, Lng ${lng}`);
    
    // שליחת העדכון לדפדפן בזמן אמת
    io.emit('locationUpdate', { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng), 
        timestamp: new Date() 
    });
    res.status(200).send("Updated");
});

// הגדרת פורט דינמי עבור Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is officially live on port ${PORT}`);
});
