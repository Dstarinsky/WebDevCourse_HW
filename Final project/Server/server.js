// server/server.js
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const https = require('https');
const bcrypt = require('bcryptjs'); 

const app = express();
const PORT = process.env.PORT || 3000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(UPLOADS_DIR)); 

// --- Initialization ---
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// --- Configure Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// --- Helper Functions ---
const readUsers = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
};

const writeUsers = (users) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

// --- Routes ---

// REGISTER
app.post('/api/register', async (req, res) => {
    const { username, password, firstName, imgUrl } = req.body;
    const users = readUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "Username already taken" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
   
    const newUser = { 
        username, 
        password: hashedPassword, 
        firstName, 
        imgUrl, 
        playlists: [] 
    };
    
    users.push(newUser);
    writeUsers(users);
    res.status(201).json({ success: true });
});

// LOGIN 
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the raw password sent from client with the hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        const { password, ...userWithoutPass } = user;
        res.json({ success: true, user: userWithoutPass });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// GET PLAYLISTS
app.get('/api/playlists/:username', (req, res) => {
    const user = readUsers().find(u => u.username === req.params.username);
    user ? res.json(user.playlists || []) : res.status(404).json({ error: "User not found" });
});

//  SAVE PLAYLISTS
app.post('/api/playlists', (req, res) => {
    const { username, playlists } = req.body;
    const users = readUsers();
    const idx = users.findIndex(u => u.username === username);
    
    if (idx !== -1) {
        users[idx].playlists = playlists;
        writeUsers(users);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

//  UPLOAD MP3
app.post('/api/upload', upload.single('mp3file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ 
        success: true, 
        fileUrl: `/uploads/${req.file.filename}`, 
        fileName: req.file.originalname 
    });
});

// YOUTUBE SEARCH
app.get('/api/youtube/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "No query" });

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
    
    https.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => res.json(JSON.parse(data)));
    }).on('error', (e) => res.status(500).json({ error: e.message }));
});

//  YOUTUBE VIDEO DETAILS
app.get('/api/youtube/videos', (req, res) => {
    const ids = req.query.id;
    if (!ids) return res.status(400).json({ error: "No ids" });
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    https.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => res.json(JSON.parse(data)));
    }).on('error', (e) => res.status(500).json({ error: e.message }));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});