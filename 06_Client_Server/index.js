// server.js

const express = require('express');
const path = require('path');
const app = express();
const PORT=3000;

// allow json in requests
app.use(express.json());

app.get('/home', (rew,res)=>{
    res.sendFile(path.join(__dirname, 'client', 'home.html'));
})
app.get('/', (rew,res)=>{
    res.sendFile(path.join(__dirname, 'client', 'home.html'));
})
app.get('/index', (rew,res)=>{
    res.sendFile(path.join(__dirname, 'client', 'home.html'));
})


// example api route
app.get('/api/info', (req, res) => {
    res.json({
        status: "ok",
        version: "1.0",
        note: "simple express server"
    });
});

let songs =[
    {id:1, title:"Nothing else matters", artist:"Metalica"},
    {id:2, title:"Dafna and Dudidu", artist:"Hop children channel"},
    {id:3, title:"Pokemon theme song", artist:"Some Japaneese guy"},
]
app.get('/api/songs', (req, res) => {
    res.json(songs);
});


// // use static folder : client
// app.use(express.static(path.join(__dirname,"client"),{
//     index:"home.html",
// }));


// start server
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});