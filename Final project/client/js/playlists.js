// client/js/playlists.js

let currentUser = null;
let currentPlaylistName = null;
let displayedSongs = []; // Keeps track of the currently sorted/filtered list

// --- Queue & Player State ---
let playQueue = [];
let queueIndex = 0;
let ytPlayer = null; // YouTube Player Instance

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load User
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) { window.location.href = 'login.html'; return; }
    currentUser = JSON.parse(userJson);

    // 2. Load YouTube API
    loadYouTubeAPI();

    // 3. Initial Data Fetch
    fetchPlaylistsFromServer().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const playlistParam = urlParams.get('id');
        if (playlistParam) loadPlaylist(playlistParam);
        else if (currentUser.playlists && currentUser.playlists.length > 0) loadPlaylist(currentUser.playlists[0].name);
    });

    // 4. Event Listeners
    document.getElementById('filterInput').addEventListener('input', (e) => {
        renderSongs(e.target.value);
    });

    // Sort Change Listener
    document.getElementById('sortSelect').addEventListener('change', () => {
        renderSongs(document.getElementById('filterInput').value); // Re-render with current filter
    });

    document.getElementById('delete-playlist-btn').addEventListener('click', deleteCurrentPlaylist);
    document.getElementById('uploadMp3Btn').addEventListener('click', uploadMp3);
    document.getElementById('playAllBtn').addEventListener('click', playAll);

    // --- PLAYER CONTROLS LISTENERS ---
    document.getElementById('videoNextBtn').addEventListener('click', playNext);
    document.getElementById('audioNextBtn').addEventListener('click', playNext);
    
    document.getElementById('videoPrevBtn').addEventListener('click', playPrevious);
    document.getElementById('audioPrevBtn').addEventListener('click', playPrevious);

    // MP3 Ended Listener (for auto-next)
    document.getElementById('audioPlayerControl').addEventListener('ended', playNext);

    // Modal Close Listeners (Stop playback when closing manually)
    document.getElementById('videoModal').addEventListener('hidden.bs.modal', stopPlayers);
    document.getElementById('audioModal').addEventListener('hidden.bs.modal', stopPlayers);
});

// --- YouTube API Setup ---
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        playerVars: { 'autoplay': 1, 'playsinline': 1 },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED is 0
    if (event.data === 0) {
        playNext();
    }
}

// --- Playlist Logic ---

async function fetchPlaylistsFromServer() {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/playlists/${currentUser.username}`);
        if (res.ok) {
            currentUser.playlists = await res.json();
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            renderSidebar();
        }
    } catch (err) { console.error("Sync Error:", err); }
}

function renderSidebar() {
    const list = document.getElementById('playlist-sidebar');
    list.innerHTML = '';
    
    if (!currentUser.playlists || currentUser.playlists.length === 0) {
        list.innerHTML = '<div class="text-muted small p-2">No playlists yet.</div>';
        return;
    }

    currentUser.playlists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = `list-group-item list-group-item-action ${pl.name === currentPlaylistName ? 'active-playlist' : ''}`;
        btn.innerHTML = `<div class="d-flex justify-content-between"><span>${pl.name}</span> <span class="badge bg-secondary rounded-pill">${pl.songs.length}</span></div>`;
        btn.onclick = () => loadPlaylist(pl.name);
        list.appendChild(btn);
    });
}

window.createNewPlaylist = async function() {
    const name = document.getElementById('newPlaylistNameSidebar').value.trim();
    if (!name) return alert("Name required");
    
    if (!currentUser.playlists) currentUser.playlists = [];
    if (currentUser.playlists.find(p => p.name === name)) return alert("Playlist exists");

    currentUser.playlists.push({ name, songs: [] });
    await syncPlaylists();
    
    bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
    document.getElementById('newPlaylistNameSidebar').value = '';
    loadPlaylist(name);
};

function loadPlaylist(name) {
    currentPlaylistName = name;
    renderSidebar();

    const playlist = currentUser.playlists.find(p => p.name === name);
    if (!playlist) return;

    document.getElementById('playlistTitle').textContent = playlist.name;
    document.getElementById('playlistCount').textContent = `${playlist.songs.length} songs`;
    
    document.getElementById('delete-playlist-btn').style.display = 'inline-block';
    document.getElementById('uploadMp3Btn').style.display = 'inline-block';
    document.getElementById('playAllBtn').style.display = playlist.songs.length > 0 ? 'inline-block' : 'none';

    renderSongs();
}

function renderSongs(filterText = '') {
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    if (!playlist) return;

    let songs = [...playlist.songs];

    // 1. Filter
    if (filterText) {
        const lower = filterText.toLowerCase();
        songs = songs.filter(s => s.snippet.title.toLowerCase().includes(lower));
    }

    // 2. Sort Logic
    const sortMode = document.getElementById('sortSelect').value;
    if (sortMode === 'name') {
        songs.sort((a, b) => a.snippet.title.localeCompare(b.snippet.title));
    } else if (sortMode === 'rating') {
        songs.sort((a, b) => (b.rating || 0) - (a.rating || 0)); 
    }

    displayedSongs = songs;

    const container = document.getElementById('songs-container');
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">No songs found.</div>';
        return;
    }

    songs.forEach((song) => {
        const id = song.isMp3 ? song.id : (song.id.videoId || song.id);
        const col = document.createElement('div');
        col.className = 'col-12';
        
        const imgUrl = song.snippet.thumbnails ? song.snippet.thumbnails.medium.url : 'https://cdn-icons-png.flaticon.com/512/9387/9387063.png';

        col.innerHTML = `
            <div class="card song-card-horizontal p-2 h-100 shadow-sm">
                <div class="d-flex align-items-center">
                    <div class="position-relative flex-shrink-0" style="width: 80px; height: 60px; cursor: pointer;" onclick="playSingle('${id}')">
                        <img src="${imgUrl}" class="w-100 h-100 rounded object-fit-cover">
                        <div class="position-absolute top-50 start-50 translate-middle">
                             <i class="bi bi-play-circle-fill text-white opacity-75 fs-4"></i>
                        </div>
                    </div>
                    <div class="ms-3 flex-grow-1 overflow-hidden">
                        <h6 class="mb-1 fw-bold text-truncate">${song.snippet.title}</h6>
                        <div class="small text-secondary mb-1 text-truncate">${song.snippet.channelTitle || 'Uploaded MP3'}</div>
                        <div class="rating-stars small text-nowrap" style="line-height: 1;">
                            ${[1,2,3,4,5].map(star => `
                                <i class="bi ${star <= (song.rating || 0) ? 'bi-star-fill' : 'bi-star'} " 
                                   onclick="rateSong('${id}', ${star})"></i>
                            `).join('')}
                        </div>
                    </div>
                    <div class="ms-3">
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="removeSong('${id}')">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// --- PLAYER LOGIC ---

function playAll() {
    if (!displayedSongs || displayedSongs.length === 0) return alert("No songs to play.");
    
    // Set up queue based on current filtered/sorted list
    playQueue = displayedSongs;
    queueIndex = 0;
    
    playCurrentQueueSong();
}

// Sets up the queue starting from the clicked song
window.playSingle = function(id) {
    if (!displayedSongs || displayedSongs.length === 0) return;

    const index = displayedSongs.findIndex(s => (s.isMp3 ? s.id : (s.id.videoId || s.id)) === id);
    if (index !== -1) {
        playQueue = displayedSongs;
        queueIndex = index;
        playCurrentQueueSong();
    }
};

function playNext() {
    queueIndex++;
    if (queueIndex >= playQueue.length) {
        stopPlayers();
        return; 
    }
    playCurrentQueueSong();
}

function playPrevious() {
    queueIndex--;
    if (queueIndex < 0) {
        // If at start, either stop or restart first song.
        // Here we restart the first song for better UX
        queueIndex = 0; 
    }
    playCurrentQueueSong();
}

function playCurrentQueueSong() {
    const song = playQueue[queueIndex];
    playMedia(song);
}

function playMedia(song) {
    // Pause any currently playing media without resetting queue
    stopPlayers(false); 

    if (song.isMp3) {
        const audio = document.getElementById('audioPlayerControl');
        document.getElementById('audioTitle').textContent = song.snippet.title;
        audio.src = song.fileUrl;
        
        // Hide Video Modal if open
        bootstrap.Modal.getInstance(document.getElementById('videoModal'))?.hide();
        
        const modal = new bootstrap.Modal(document.getElementById('audioModal'));
        modal.show();
        audio.play().catch(e => console.log("Autoplay blocked:", e));

    } else {
        const videoId = song.id.videoId || song.id;
        
        // Hide Audio Modal if open
        bootstrap.Modal.getInstance(document.getElementById('audioModal'))?.hide();

        const modal = new bootstrap.Modal(document.getElementById('videoModal'));
        modal.show();

        setTimeout(() => {
            if (ytPlayer && ytPlayer.loadVideoById) {
                ytPlayer.loadVideoById(videoId);
            } else {
                document.getElementById('yt-player-target').innerHTML = 
                    `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
            }
        }, 300);
    }
}

function stopPlayers(fullReset = true) {
    const audio = document.getElementById('audioPlayerControl');
    audio.pause();
    if (ytPlayer && ytPlayer.stopVideo) {
        ytPlayer.stopVideo();
    }
}

// --- Utilities ---

window.removeSong = async function(id) {
    if (!confirm("Remove song?")) return;
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    playlist.songs = playlist.songs.filter(s => (s.isMp3 ? s.id : (s.id.videoId || s.id)) !== id);
    await syncPlaylists();
    loadPlaylist(currentPlaylistName);
};

window.rateSong = async function(id, rating) {
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    const song = playlist.songs.find(s => (s.isMp3 ? s.id : (s.id.videoId || s.id)) === id);
    if (song) {
        song.rating = rating;
        await syncPlaylists();
        renderSongs(document.getElementById('filterInput').value);
    }
};

window.deleteCurrentPlaylist = async function() {
    if (!confirm(`Delete playlist "${currentPlaylistName}"?`)) return;
    currentUser.playlists = currentUser.playlists.filter(p => p.name !== currentPlaylistName);
    await syncPlaylists();
    
    if (currentUser.playlists.length > 0) {
        loadPlaylist(currentUser.playlists[0].name);
    } else {
        window.location.reload();
    }
};

async function syncPlaylists() {
    try {
        await fetch(`${CONFIG.SERVER_URL}/api/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, playlists: currentUser.playlists })
        });
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (e) { console.error(e); }
}

window.uploadMp3 = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mp3';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('mp3file', file);

        try {
            const res = await fetch(`${CONFIG.SERVER_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                const song = {
                    id: Date.now().toString(),
                    isMp3: true,
                    fileUrl: `${CONFIG.SERVER_URL}${data.fileUrl}`,
                    snippet: {
                        title: file.name.replace('.mp3', ''),
                        channelTitle: 'My Uploads',
                        thumbnails: { medium: { url: 'https://cdn-icons-png.flaticon.com/512/9387/9387063.png' } }
                    }
                };
                
                const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
                playlist.songs.push(song);
                await syncPlaylists();
                renderSongs();
            } else {
                alert("Upload failed");
            }
        } catch (e) { console.error(e); alert("Error uploading"); }
    };
    input.click();
};