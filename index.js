const form = document.getElementById('songForm');
const list = document.getElementById('songList');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('search');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const tableView = document.getElementById('tableView');
const cardView = document.getElementById('cardView');

let songs = JSON.parse(localStorage.getItem('playlist')) || [];

// UI state
let currentSearch = '';
let currentSort = 'newest'; // newest, name, rating
let currentView = 'table';  // table, cards

// Helpers

function extractYouTubeId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            return u.pathname.slice(1);
        }
        if (u.searchParams.get('v')) {
            return u.searchParams.get('v');
        }
        if (u.pathname.startsWith('/embed/')) {
            const parts = u.pathname.split('/');
            return parts[2] || null;
        }
    } catch (e) {
        // not a valid url
    }
    return null;
}

function getThumbnailUrl(song) {
    const id = song.videoId || extractYouTubeId(song.url);
    if (!id) return '';
    return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
}

function openPlayer(videoId) {
    if (!videoId) return;
    const width = 640;
    const height = 390;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const features =
        'width=' + width +
        ',height=' + height +
        ',top=' + top +
        ',left=' + left +
        ',resizable=yes,scrollbars=yes';

    const url = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    window.open(url, 'yt_player_' + videoId, features);
}

function saveToStorage() {
    localStorage.setItem('playlist', JSON.stringify(songs));
}

function getVisibleSongs() {
    // filter
    let filtered = songs.filter(song =>
        song.title.toLowerCase().includes(currentSearch.toLowerCase())
    );

    // sort
    if (currentSort === 'name') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'rating') {
        filtered.sort((a, b) => {
            const rA = Number(a.rating || 0);
            const rB = Number(b.rating || 0);
            if (rB !== rA) return rB - rA; // high to low
            return b.dateAdded - a.dateAdded;
        });
    } else {
        // newest first
        filtered.sort((a, b) => b.dateAdded - a.dateAdded);
    }

    return filtered;
}

function resetForm() {
    form.reset();
    document.getElementById('songId').value = '';
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-success');
}

// Rendering

function renderSongs() {
    const data = getVisibleSongs();

    // clear both views
    list.innerHTML = '';
    cardView.innerHTML = '';

    if (data.length === 0) {
        if (currentView === 'table') {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center text-muted">
                    No songs in the playlist yet
                </td>
            `;
            list.appendChild(row);
        } else {
            const empty = document.createElement('div');
            empty.className = 'col-12 text-center text-muted';
            empty.textContent = 'No songs in the playlist yet';
            cardView.appendChild(empty);
        }
        return;
    }

    if (currentView === 'table') {
        data.forEach(song => {
            const thumbnail = getThumbnailUrl(song);
            const videoId = song.videoId || extractYouTubeId(song.url);

            const row = document.createElement('tr');

            row.innerHTML = `
                <td style="width: 120px;">
                    ${thumbnail
                        ? `<img src="${thumbnail}" alt="${song.title}" class="img-fluid rounded" />`
                        : '<span class="text-muted">No image</span>'
                    }
                </td>
                <td>${song.title}</td>
                <td>${song.rating ? '⭐'.repeat(song.rating) : '-'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-info me-2" onclick="playSong(${song.id})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-2" onclick="editSong(${song.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            list.appendChild(row);
        });
    } else {
        // cards view
        data.forEach(song => {
            const thumbnail = getThumbnailUrl(song);
            const videoId = song.videoId || extractYouTubeId(song.url);

            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

            col.innerHTML = `
                <div class="card h-100 bg-dark border-secondary">
                    ${thumbnail
                        ? `<img src="${thumbnail}" class="card-img-top" alt="${song.title}">`
                        : ''
                    }
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${song.title}</h5>
                        <p class="card-text mb-2">
                            Rating: ${song.rating ? '⭐'.repeat(song.rating) : '-'}
                        </p>
                        <div class="mt-auto d-flex justify-content-between">
                            <button class="btn btn-sm btn-info" onclick="playSong(${song.id})">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editSong(${song.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cardView.appendChild(col);
        });
    }
}

function saveAndRender() {
    saveToStorage();
    renderSongs();
}

// CRUD

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const url = document.getElementById('url').value.trim();
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const rating = ratingInput ? Number(ratingInput.value) : null;
    const idField = document.getElementById('songId').value;

    if (!title || !url || !rating) return;

    const videoId = extractYouTubeId(url);

    if (idField) {
        // update existing
        updateSong(Number(idField), title, url, rating, videoId);
    } else {
        // add new
        const song = {
            id: Date.now(),
            title: title,
            url: url,
            rating: rating,
            videoId: videoId,
            dateAdded: Date.now()
        };
        songs.push(song);
    }

    saveAndRender();
    resetForm();
});

function deleteSong(id) {
    if (confirm('Are you sure?')) {
        songs = songs.filter(song => song.id !== id);
        saveAndRender();
    }
}

function editSong(id) {
    const songToEdit = songs.find(song => song.id === id);
    if (!songToEdit) return;

    document.getElementById('title').value = songToEdit.title;
    document.getElementById('url').value = songToEdit.url;
    document.getElementById('songId').value = songToEdit.id;

    // set rating radio
    if (songToEdit.rating) {
        const radio = document.querySelector('input[name="rating"][value="' + songToEdit.rating + '"]');
        if (radio) radio.checked = true;
    }

    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update';
    submitBtn.classList.remove('btn-success');
    submitBtn.classList.add('btn-warning');
}

function updateSong(id, title, url, rating, videoId) {
    const index = songs.findIndex(song => song.id === id);
    if (index === -1) return;

    songs[index].title = title;
    songs[index].url = url;
    songs[index].rating = rating;
    songs[index].videoId = videoId;
}

// small wrapper because we use onclick in HTML strings
function playSong(id) {
    const song = songs.find(s => s.id === id);
    if (!song) return;
    const videoId = song.videoId || extractYouTubeId(song.url);
    openPlayer(videoId);
}

// search, sort, view

searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value;
    renderSongs();
});

document.querySelectorAll('input[name="sortOption"]').forEach(radio => {
    radio.addEventListener('change', () => {
        currentSort = radio.value;
        renderSongs();
    });
});

viewToggleBtn.addEventListener('click', () => {
    if (currentView === 'table') {
        currentView = 'cards';
        tableView.classList.add('d-none');
        cardView.classList.remove('d-none');
        viewToggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
    } else {
        currentView = 'table';
        cardView.classList.add('d-none');
        tableView.classList.remove('d-none');
        viewToggleBtn.innerHTML = '<i class="fas fa-table"></i>';
    }
    renderSongs();
});

// init on page load
document.addEventListener('DOMContentLoaded', () => {
    // make sure older songs without rating or videoId still work
    songs = songs.map(song => ({
        ...song,
        rating: song.rating || null,
        videoId: song.videoId || extractYouTubeId(song.url),
        dateAdded: song.dateAdded || Date.now()
    }));
    saveToStorage();
    renderSongs();
});