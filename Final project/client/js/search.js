const SEARCH_PROXY = `${CONFIG.SERVER_URL}/api/youtube/search`;
const VIDEO_PROXY = `${CONFIG.SERVER_URL}/api/youtube/videos`;

let currentSearchResults = [];
let selectedVideo = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(userJson);
    renderWelcome();

    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('confirmAddBtn').addEventListener('click', saveToPlaylist);
});

function renderWelcome() {
    document.getElementById('welcome-section').innerHTML = `
        <h2 class="fw-bold">Welcome, ${currentUser.firstName}</h2>
        <img src="${currentUser.imgUrl}" class="rounded-circle border border-3 border-white mt-3 shadow" style="width: 80px; height: 80px; object-fit: cover;">
    `;
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const container = document.getElementById('results-container');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const searchRes = await fetch(`${SEARCH_PROXY}?q=${encodeURIComponent(query)}`);
        if (!searchRes.ok) throw new Error("Search failed");
        
        const searchData = await searchRes.json();
        if (!searchData.items || searchData.items.length === 0) {
            container.innerHTML = '<div class="text-center text-muted">No results found.</div>';
            return;
        }

        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        const videoRes = await fetch(`${VIDEO_PROXY}?id=${videoIds}`);
        const videoData = await videoRes.json();

        currentSearchResults = videoData.items;
        renderResults(currentSearchResults);

    } catch (error) {
        console.error("API Error:", error);
        container.innerHTML = `<div class="text-center text-danger">Error: ${error.message}</div>`;
    }
}

function renderResults(videos) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    videos.forEach(video => {
        const videoId = video.id;
        const snippet = video.snippet;
        const isSaved = isVideoInFavorites(videoId);

        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0" style="background: var(--card-bg); color: var(--text-primary);">
                <div class="position-relative" style="cursor: pointer;" onclick="openPlayer('${videoId}')">
                    <img src="${snippet.thumbnails.medium.url}" class="card-img-top">
                    <div class="position-absolute top-50 start-50 translate-middle">
                        <i class="bi bi-play-circle-fill text-white display-4 opacity-75"></i>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold text-truncate-2" title="${snippet.title}">${snippet.title}</h6>
                    <p class="small text-secondary mb-3">${snippet.channelTitle}</p>
                    <div class="mt-auto">
                        <button class="btn w-100 btn-sm fw-bold ${isSaved ? 'btn-secondary disabled' : 'btn-outline-custom'}" 
                                onclick="openAddModal('${videoId}')" ${isSaved ? 'disabled' : ''}>
                            ${isSaved ? '<i class="bi bi-check-lg"></i> Saved' : '<i class="bi bi-heart"></i> Add to Favorites'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// --- Player Logic (Reused Instance) ---
let videoModalInstance = null;
window.openPlayer = function(videoId) {
    const frame = document.getElementById('videoPlayerFrame');
    frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    
    if (!videoModalInstance) {
        const el = document.getElementById('videoModal');
        videoModalInstance = new bootstrap.Modal(el);
        el.addEventListener('hidden.bs.modal', () => { frame.src = ''; });
    }
    videoModalInstance.show();
};

window.openAddModal = function(videoId) {
    selectedVideo = currentSearchResults.find(v => v.id === videoId);
    const select = document.getElementById('existingPlaylistSelect');
    select.innerHTML = '<option value="">Select a playlist...</option>';
    
    if (currentUser.playlists) {
        currentUser.playlists.forEach(pl => {
            const opt = document.createElement('option');
            opt.value = pl.name;
            opt.textContent = pl.name;
            select.appendChild(opt);
        });
    }
    new bootstrap.Modal(document.getElementById('addToPlaylistModal')).show();
};

async function saveToPlaylist() {
    const existing = document.getElementById('existingPlaylistSelect').value;
    const newName = document.getElementById('newPlaylistName').value.trim();
    let targetName = newName || existing;

    if (!targetName) return alert("Please select or create a playlist.");
    if (!currentUser.playlists) currentUser.playlists = [];

    let playlist = currentUser.playlists.find(pl => pl.name === targetName);
    if (!playlist) {
        playlist = { name: targetName, songs: [] };
        currentUser.playlists.push(playlist);
    }

    if (!playlist.songs.find(s => s.id === selectedVideo.id)) {
        playlist.songs.push(selectedVideo);
        
        try {
            await fetch(`${CONFIG.SERVER_URL}/api/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, playlists: currentUser.playlists })
            });
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            bootstrap.Modal.getInstance(document.getElementById('addToPlaylistModal')).hide();
            new bootstrap.Toast(document.getElementById('successToast')).show();
            renderResults(currentSearchResults);
        } catch (error) {
            console.error(error);
            alert("Save failed.");
        }
    }
}

function isVideoInFavorites(videoId) {
    if (!currentUser.playlists) return false;
    return currentUser.playlists.some(pl => pl.songs.some(s => s.id === videoId));
}