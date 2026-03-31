
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

btnNo.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});

const urlParams = new URLSearchParams(window.location.search);
let tags = urlParams.get('tags') || "femboy";
const limit = 20;
const pid = 0; 

const apiKey = "e154d25fd829562d05143096818747c03d25238896a92e3a914ff8c14a41e0c4d84645b02894b1f34da73c5e2bb79df30d8f65c9a0dfc2cb4f2e10f0710f8270"
const userID = "6048827"
const BASE_API_URL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=${limit}&api_key=${apiKey}&user_id=${userID}&pid=`; 

let currentPage = 1;
let isFetching = false;

const gallery = document.getElementById('gallery');
const loadingTrigger = document.getElementById('loading-trigger');

async function fetchMoreImages() {
    if (isFetching) return; 
    isFetching = true;

    try {
        const response = await fetch(`${BASE_API_URL}${currentPage}&tags=${tags}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            loadingTrigger.innerText = "No more images to load.";
            observer.disconnect(); 
            return;
        }

        data.forEach(item => {
            const link = document.createElement('a');
            link.href = item.file_url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            const img = document.createElement('img');
            img.src = item.preview_url || item.sample_url || item.file_url;
            item.alt = item.description || 'Gallery image';
            item.loading = "lazy";

            link.appendChild(img);
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

const observerOptions = {
    root: null,
    rootMargin: '200px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        fetchMoreImages();
    }
}, observerOptions);

observer.observe(loadingTrigger);