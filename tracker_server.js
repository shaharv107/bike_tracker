const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// הגדרות בסיסיות
app.use(cors());
app.use(bodyParser.json());

// --- 1. הזרקה דינמית של מפתח ה-API לדף הבית ---
// חשוב: זה מופיע לפני express.static כדי להבטיח שהקוד שלך ירוץ קודם
app.get('/', (req, res) => {
    // וודא שהקובץ בתיקיית public אכן נקרא tracker_index.html
    const filePath = path.join(__dirname, 'public', 'tracker_index.html');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading HTML file:", err);
            return res.status(500).send('Error loading page - Make sure tracker_index.html exists in public folder');
    });
        }

        // שליפת המפתח מה-Environment Variables של Render
        const apiKey = process.env.MAPS_API_KEY || "MISSING_KEY";
        
        // החלפת הפלייסולדר במפתח האמיתי
        const modifiedData = data.replace('__GOOGLE_MAPS_API_KEY__', apiKey);
        
        res.send(modifiedData);
    });
});

// --- 2. הגשת שאר הקבצים הסטטיים (CSS, תמונות, JS) ---
app.use(express.static('public'));

// --- 3. נתיב לקבלת מיקום מה-LilyGo (ה-API שלך) ---
app.post('/api/location', (req, res) => {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).send("Missing coordinates");
    }

    console.log(`Received Location: Lat ${lat}, Lng ${lng}`);
    
    // שליחה בזמן אמת לכל הדפדפנים המחוברים
    io.emit('locationUpdate', { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng), 
        timestamp: new Date() 
    });
    
    res.status(200).send("Updated Successfully");
});

// הגדרת הפורט - Render מספק אותו אוטומטית
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Security Status: API Key injection is ACTIVE`);
});



