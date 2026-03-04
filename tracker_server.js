const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); // ספרייה לקריאת קבצים

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// הזרקה דינמית של מפתח ה-API
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'tracker_index.html');
    
    // קריאת קובץ ה-HTML
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error loading page');
        }

        // החלפת הפלייסולדר במפתח האמיתי מה-Environment Variables של Render
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || "MISSING_KEY";
        const modifiedData = data.replace('__GOOGLE_MAPS_API_KEY__', apiKey);
        
        res.send(modifiedData);
    });
});

app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).send("Missing coordinates");
    console.log(`Received: Lat ${lat}, Lng ${lng}`);
    io.emit('locationUpdate', { lat: parseFloat(lat), lng: parseFloat(lng), timestamp: new Date() });
    res.status(200).send("Updated");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live and secure on port ${PORT}`);
});
