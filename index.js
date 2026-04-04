// --- Age Gate ---
const ageGate = document.getElementById('age-gate');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');

const isVerified = localStorage.getItem('ageVerified');
if (!isVerified) {
    ageGate.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

btnYes.addEventListener('click', () => {
    localStorage.setItem('ageVerified', 'true');
    ageGate.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

btnNo.addEventListener('click', () => { window.location.href = 'https://www.google.com'; });

// --- Global Variables & API Setup ---
const urlParams = new URLSearchParams(window.location.search);
let tags = urlParams.get('tags') || "femboy";

const limit = 20;
const pid = 0; 
const apiKey = "e154d25fd829562d05143096818747c03d25238896a92e3a914ff8c14a41e0c4d84645b02894b1f34da73c5e2bb79df30d8f65c9a0dfc2cb4f2e10f0710f8270";
const userID = "6048827";
const BASE_API_URL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=${limit}&api_key=${apiKey}&user_id=${userID}&pid=`; 

let currentPage = 1;
let isFetching = false;
let searchTimeout;
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

let allFetchedImages = []; 
let currentViewList = []; 
let currentImageIndex = 0;

// --- DOM Elements ---
const gallery = document.getElementById('gallery');
const favGallery = document.getElementById('fav-gallery');
const loadingTrigger = document.getElementById('loading-trigger');
const mainView = document.getElementById('main-view');
const favView = document.getElementById('fav-view');
const navHome = document.getElementById('nav-home');
const navFavs = document.getElementById('nav-favs');
const searchInput = document.getElementById('tag-search');
const suggestionsBox = document.getElementById('search-suggestions');
const gridSlider = document.getElementById('grid-slider');
const randomToggle = document.getElementById('random-toggle');
const bttBtn = document.getElementById('btt-btn');

const sidePanel = document.getElementById('side-panel');
const sideClose = document.getElementById('side-close');
const sideFavBtn = document.getElementById('side-fav-btn');
const sideExpand = document.getElementById('side-expand');
const sideOriginal = document.getElementById('side-original');
const sideImage = document.getElementById('side-image');

const detailView = document.getElementById('detail-view');
const detailBack = document.getElementById('detail-back');
const detailImage = document.getElementById('detail-image');
const detailPrev = document.getElementById('detail-prev');
const detailNext = document.getElementById('detail-next');
const detailCounter = document.getElementById('detail-counter');
const detailFavBtn = document.getElementById('detail-fav-btn'); // Make sure we grab this!

// --- Back to Top Logic ---
window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        bttBtn.classList.remove('hidden');
    } else {
        bttBtn.classList.add('hidden');
    }
});

bttBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Controls ---
gridSlider.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--grid-min', `${e.target.value}px`);
});

randomToggle.addEventListener('change', () => {
    gallery.innerHTML = '';
    allFetchedImages = []; 
    currentPage = 1;
    fetchMoreImages();
});

// --- Search & Autocomplete ---
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) { suggestionsBox.classList.add('hidden'); return; }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://api.rule34.xxx/autocomplete.php?api_key=${apiKey}&user_id=${userID}&q=${query}`);
            const data = await res.json();
            suggestionsBox.innerHTML = '';
            
            if (data.length > 0) {
                data.forEach(tag => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    const tagName = tag.value || tag.name || tag;
                    div.innerText = tagName;
                    div.addEventListener('click', () => {
                        searchInput.value = tagName;
                        suggestionsBox.classList.add('hidden');
                        loadNewTag(tagName);
                    });
                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.classList.remove('hidden');
            } else { suggestionsBox.classList.add('hidden'); }
        } catch (error) { console.error(error); }
    }, 300);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestionsBox.classList.add('hidden');
        if (searchInput.value.trim()) loadNewTag(searchInput.value.trim());
    }
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
    }
});

function loadNewTag(newTag) {
    tags = newTag;
    currentPage = 1;
    allFetchedImages = []; 
    gallery.innerHTML = '';
    window.history.pushState({}, '', `?tags=${tags}`);
    fetchMoreImages();
}

// --- Fetch API ---
async function fetchMoreImages() {
    if (isFetching || !favView.classList.contains('hidden')) return; 
    isFetching = true;

    try {
        let fetchTags = tags;
        if (randomToggle.checked) fetchTags += "+sort:random";

        const response = await fetch(`${BASE_API_URL}${currentPage}&tags=${fetchTags}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.length === 0) {
            loadingTrigger.innerText = "No more images to load.";
            observer.disconnect(); 
            return;
        }

        data.forEach(item => {
            allFetchedImages.push(item);
            const itemIndex = allFetchedImages.length - 1; 

            const link = document.createElement('div');
            link.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = item.sample_url || item.file_url || item.preview_url;
            img.loading = "lazy";

            link.appendChild(img);
            link.addEventListener('click', () => openSidePanel(itemIndex, false));
            gallery.appendChild(link);
        });

        currentPage++;
    } catch (error) {
        console.error("Failed to fetch images:", error);
        loadingTrigger.innerText = "Failed to load images.";
    } finally {
        isFetching = false;
    }
}

// --- View State Logic (Side Panel & Detail) ---
function openSidePanel(index, isFavContext) {
    currentViewList = isFavContext ? favorites : allFetchedImages;
    currentImageIndex = index;
    const item = currentViewList[currentImageIndex];

    sideImage.src = item.sample_url || item.file_url;
    sideOriginal.href = item.file_url;
    
    updateFavButtonState(item);
    
    sidePanel.classList.remove('hidden');
    document.getElementById('gallery').style.marginRight = "400px";
    document.getElementById('fav-gallery').style.marginRight = "400px";
}

function closeSidePanel() {
    sidePanel.classList.add('hidden');
    document.getElementById('gallery').style.marginRight = "auto";
    document.getElementById('fav-gallery').style.marginRight = "auto";
}

function openFullScreen() {
    closeSidePanel();
    document.body.style.overflow = 'hidden';
    detailView.classList.remove('hidden');
    renderFullScreenImage();
}

function closeFullScreen() {
    document.body.style.overflow = 'auto';
    detailView.classList.add('hidden');
    if (!favView.classList.contains('hidden')) {
        renderFavorites(); 
    }
}

// --- Navigation Logic ---
function renderFullScreenImage() {
    const item = currentViewList[currentImageIndex];
    detailImage.src = item.sample_url || item.file_url;
    
    updateFavButtonState(item);
    
    // const totalCountText = currentViewList === favorites ? currentViewList.length  : `${currentViewList.length}+`;
    detailCounter.innerText = `${currentImageIndex + 1}`;

    detailPrev.disabled = currentImageIndex === 0;
    
    if (currentViewList === favorites && currentImageIndex === currentViewList.length - 1) {
        detailNext.disabled = true;
    } else {
        detailNext.disabled = false;
    }
}

async function nextImage() {
    if (currentImageIndex >= currentViewList.length - 1) {
        if (currentViewList === favorites) return;

        const originalText = detailNext.innerHTML;
        detailNext.innerHTML = '⌛';
        detailNext.disabled = true;

        const previousLength = allFetchedImages.length;
        await fetchMoreImages();

        detailNext.innerHTML = originalText;
        detailNext.disabled = false;

        if (allFetchedImages.length === previousLength) return;
    }
    
    currentImageIndex++;
    renderFullScreenImage();
}

function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        renderFullScreenImage();
    }
}

// --- Favorites Logic ---
function toggleFavorite() {
    const item = currentViewList[currentImageIndex];
    if (!item) return;

    const index = favorites.findIndex(fav => fav.id === item.id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(item);
    }
    
    localStorage.setItem('favs', JSON.stringify(favorites));
    updateFavButtonState(item);
}

// THIS FUNCTION WAS FIXED TO UPDATE BOTH BUTTONS
function updateFavButtonState(item) {
    if (!item) return;
    const isFav = favorites.some(fav => fav.id === item.id);
    
    // 1. Update the Side Panel Button
    if (isFav) {
        sideFavBtn.innerText = "❤️ Fav'd";
        sideFavBtn.classList.add('favorited');
    } else {
        sideFavBtn.innerText = "🤍 Fav";
        sideFavBtn.classList.remove('favorited');
    }

    // 2. Update the Full Screen Button
    if (isFav) {
        detailFavBtn.innerText = "❤️ Remove from Favourites";
        detailFavBtn.classList.add('favorited');
    } else {
        detailFavBtn.innerText = "🤍 Add to Favourites";
        detailFavBtn.classList.remove('favorited');
    }
}

function renderFavorites() {
    favGallery.innerHTML = '';
    if (favorites.length === 0) {
        favGallery.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No favourites yet.</p>';
        return;
    }
    favorites.forEach((item, index) => {
        const link = document.createElement('div');
        link.className = 'gallery-item';
        const img = document.createElement('img');
        img.src = item.sample_url || item.file_url || item.preview_url;
        img.loading = "lazy";
        link.appendChild(img);
        
        link.addEventListener('click', () => openSidePanel(index, true)); 
        favGallery.appendChild(link);
    });
}

// --- Event Listeners ---
sideClose.addEventListener('click', closeSidePanel);
sideFavBtn.addEventListener('click', toggleFavorite);
sideExpand.addEventListener('click', openFullScreen);

detailBack.addEventListener('click', closeFullScreen);
detailPrev.addEventListener('click', prevImage);
detailNext.addEventListener('click', nextImage);
detailFavBtn.addEventListener('click', toggleFavorite); // Listens for clicks in full screen

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (!detailView.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeFullScreen();
    }
    if (!sidePanel.classList.contains('hidden')) {
        if (e.key === 'Escape') closeSidePanel();
    }
});

navHome.addEventListener('click', () => {
    navHome.classList.add('active');
    navFavs.classList.remove('active');
    favView.classList.add('hidden');
    mainView.classList.remove('hidden');
});

navFavs.addEventListener('click', () => {
    navFavs.classList.add('active');
    navHome.classList.remove('active');
    mainView.classList.add('hidden');
    favView.classList.remove('hidden');
    renderFavorites();
});

// --- Infinite Scroll ---
const observerOptions = { root: null, rootMargin: '200px', threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) fetchMoreImages();
}, observerOptions);
observer.observe(loadingTrigger);
