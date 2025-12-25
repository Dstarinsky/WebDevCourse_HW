let currentUser = null;
let currentPlaylistName = null;

document.addEventListener('DOMContentLoaded', () => {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) { window.location.href = 'login.html'; return; }
    currentUser = JSON.parse(userJson);

    fetchPlaylistsFromServer().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const playlistParam = urlParams.get('id');
        if (playlistParam) loadPlaylist(playlistParam);
        else if (currentUser.playlists && currentUser.playlists.length > 0) loadPlaylist(currentUser.playlists[0].name);
    });

    document.getElementById('filterInput').addEventListener('input', (e) => renderSongs(e.target.value));
    document.getElementById('sortSelect').addEventListener('change', () => renderSongs());
    document.getElementById('delete-playlist-btn').addEventListener('click', deleteCurrentPlaylist);
    document.getElementById('uploadMp3Btn').addEventListener('click', uploadMp3);
});

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
        list.innerHTML = '<div class="text-center text-muted small py-3">No playlists yet.</div>';
        return;
    }
    currentUser.playlists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${pl.name === currentPlaylistName ? 'active-playlist' : ''}`;
        btn.style.backgroundColor = 'transparent';
        if(pl.name !== currentPlaylistName) btn.style.color = 'var(--text-primary)';
        btn.innerHTML = `<span>${pl.name}</span><span class="badge bg-secondary rounded-pill">${pl.songs.length}</span>`;
        btn.onclick = () => loadPlaylist(pl.name);
        list.appendChild(btn);
    });
}

function loadPlaylist(name) {
    currentPlaylistName = name;
    renderSidebar();
    const playlist = currentUser.playlists.find(p => p.name === name);
    if (!playlist) return;

    document.getElementById('current-playlist-title').textContent = playlist.name;
    document.getElementById('current-playlist-count').textContent = `${playlist.songs.length} songs`;
    document.getElementById('delete-playlist-btn').classList.remove('d-none');
    document.getElementById('filterInput').value = '';
    renderSongs();
}

function renderSongs(filterText = '') {
    const container = document.getElementById('songs-container');
    container.innerHTML = '';
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    if (!playlist || playlist.songs.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">Empty playlist.</div>';
        return;
    }

    let displaySongs = playlist.songs;
    if (filterText) {
        displaySongs = displaySongs.filter(s => s.snippet.title.toLowerCase().includes(filterText.toLowerCase()));
    }
    
    const sortMode = document.getElementById('sortSelect').value;
    displaySongs.sort((a, b) => {
        if (sortMode === 'name') return a.snippet.title.localeCompare(b.snippet.title);
        return (b.userRating || 0) - (a.userRating || 0);
    });

    displaySongs.forEach(song => {
        const rating = song.userRating || 0;
        const songId = song.id.videoId || song.id; 
        const thumb = song.snippet.thumbnails ? song.snippet.thumbnails.medium.url : 'https://cdn-icons-png.flaticon.com/512/9386/9386926.png';

        const card = document.createElement('div');
        card.className = 'card song-card-horizontal shadow-sm p-2';
        card.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0 position-relative" style="cursor: pointer; width: 120px;" onclick="openPlayer('${songId}')">
                    <img src="${thumb}" class="img-fluid rounded">
                    <div class="position-absolute top-50 start-50 translate-middle">
                        <i class="bi bi-play-circle-fill text-white fs-3 opacity-75"></i>
                    </div>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h6 class="fw-bold mb-1 text-truncate-2">${song.snippet.title}</h6>
                    <div class="d-flex align-items-center mt-2">
                        <small class="me-2 text-secondary">Rate:</small>
                        <div class="rating-stars" style="color: #ffc107;">
                            ${[1, 2, 3, 4, 5].map(star => `<i class="bi ${star <= rating ? 'bi-star-fill' : 'bi-star'} me-1" onclick="rateSong('${songId}', ${star})"></i>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="ms-3">
                    <button class="btn btn-outline-danger btn-sm" onclick="removeSong('${songId}')"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- Actions (Upload, Rate, Delete) ---

async function uploadMp3() {
    const file = document.getElementById('mp3UploadInput').files[0];
    if (!file || !currentPlaylistName) return alert("Select file and playlist first.");

    const formData = new FormData();
    formData.append('mp3file', file);

    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            const mp3Song = {
                id: "mp3-" + Date.now(), isMp3: true, fileUrl: data.fileUrl,
                snippet: { title: data.fileName, thumbnails: { medium: { url: "https://cdn-icons-png.flaticon.com/512/9386/9386926.png" } } }
            };
            const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
            playlist.songs.push(mp3Song);
            saveUserData();
            renderSongs();
            alert("Upload successful!");
        } else { alert("Upload failed."); }
    } catch (e) { console.error(e); }
}

window.rateSong = function(id, rating) {
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    const song = playlist.songs.find(s => (s.id.videoId || s.id) === id);
    if (song) { song.userRating = rating; saveUserData(); renderSongs(); }
};

window.removeSong = function(id) {
    if(!confirm("Remove song?")) return;
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    playlist.songs = playlist.songs.filter(s => (s.id.videoId || s.id) !== id);
    saveUserData();
    document.getElementById('current-playlist-count').textContent = `${playlist.songs.length} songs`;
    renderSongs();
};

function createNewPlaylist() {
    const name = document.getElementById('newPlaylistNameSidebar').value.trim();
    if (!name) return;
    if (currentUser.playlists.some(p => p.name === name)) return alert("Exists!");
    currentUser.playlists.push({ name: name, songs: [] });
    saveUserData();
    bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
    renderSidebar();
    loadPlaylist(name);
}

function deleteCurrentPlaylist() {
    if(!confirm("Delete playlist?")) return;
    currentUser.playlists = currentUser.playlists.filter(p => p.name !== currentPlaylistName);
    saveUserData();
    currentPlaylistName = null;
    renderSidebar();
    if (currentUser.playlists.length > 0) loadPlaylist(currentUser.playlists[0].name);
    else {
        document.getElementById('songs-container').innerHTML = '';
        document.getElementById('current-playlist-title').textContent = "Select a Playlist";
    }
}

async function saveUserData() {
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    await fetch(`${CONFIG.SERVER_URL}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, playlists: currentUser.playlists })
    });
}

// --- Player Logic ---
let videoModalInstance = null, audioModalInstance = null;
window.openPlayer = function(id) {
    const playlist = currentUser.playlists.find(p => p.name === currentPlaylistName);
    const song = playlist.songs.find(s => (s.id.videoId || s.id) === id);

    if (song && song.isMp3) {
        const audio = document.getElementById('audioPlayerControl');
        document.getElementById('audioTitle').textContent = song.snippet.title;
        audio.src = song.fileUrl;
        if (!audioModalInstance) {
            audioModalInstance = new bootstrap.Modal(document.getElementById('audioModal'));
            document.getElementById('audioModal').addEventListener('hidden.bs.modal', () => { audio.pause(); });
        }
        audioModalInstance.show();
        audio.play();
    } else {
        const frame = document.getElementById('videoPlayerFrame');
        frame.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
        if (!videoModalInstance) {
            const el = document.getElementById('videoModal');
            videoModalInstance = new bootstrap.Modal(el);
            el.addEventListener('hidden.bs.modal', () => { frame.src = ''; });
        }
        videoModalInstance.show();
    }
};