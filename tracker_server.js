const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // הוספנו את זה לניהול נתיבים

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

// --- החלק החדש: הגדרת דף הבית לקובץ הספציפי שלך ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracker_index.html'));
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/tracker_index.html');
});
// Endpoint לקבלת נתונים
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).send("Missing coordinates");
    
    console.log(`Received: Lat ${lat}, Lng ${lng}`);
    io.emit('locationUpdate', { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng), 
        timestamp: new Date() 
    });
    res.status(200).send("Updated");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is officially live on port ${PORT}`);
});

});
