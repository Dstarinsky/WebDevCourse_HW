// 1. Load variables from .env immediately
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
// 2. Get API Key from Environment
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Configure Multer (For MP3s) ---
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

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

// --- 🌍 NEW: YOUTUBE PROXY ROUTES ---

// Proxy 1: Search
app.get('/api/youtube/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "No query provided" });

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (error) {
        console.error("YouTube Proxy Error:", error);
        res.status(500).json({ error: "Server failed to fetch from YouTube" });
    }
});

// Proxy 2: Video Details
app.get('/api/youtube/videos', async (req, res) => {
    const videoIds = req.query.id;
    if (!videoIds) return res.status(400).json({ error: "No video IDs provided" });

    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Server failed to fetch video details" });
    }
});

// --- AUTH ROUTES ---
// admin login page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../adminLogin.html'));
});

// Register (Expects HASHED password)
app.post('/api/register', (req, res) => {
    const { username, password, firstName, imgUrl } = req.body;
    const users = readUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "Username already exists" });
    }

    // Store the hash exactly as sent by the client
    const newUser = { username, password, firstName, imgUrl, playlists: [] };
    users.push(newUser);
    writeUsers(users);

    res.json({ success: true });
});

// Login (Compares HASHED password)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    
    // Compare the incoming hash with the stored hash
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const { password, ...userData } = user; // Exclude hash from response
        res.json({ success: true, user: userData });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// ... (Keep existing playlists/upload routes identical to previous steps) ...
// Playlists GET
app.get('/api/playlists/:username', (req, res) => {
    const user = readUsers().find(u => u.username === req.params.username);
    user ? res.json(user.playlists || []) : res.status(404).json({ error: "User not found" });
});

// Playlists POST
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

// Upload POST
app.post('/api/upload', upload.single('mp3file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    res.json({ 
        success: true, 
        fileUrl: `.../uploads/${req.file.filename}`, 
        fileName: req.file.originalname 
    });
});

app.listen(PORT, () => {
    console.log(`Server running`);
});

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../client/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Error loading homepage. Check server logs.");
        }
    });
});