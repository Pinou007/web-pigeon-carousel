// ==========================================================================
// Pigeon Carousel - Script Principal
// ==========================================================================

const TOTAL_IMAGES = 50; // 50 photos réelles de pigeons
let currentImageIndex = 1;
let carouselInterval = null;
let isPlaying = true;
const SLIDE_DURATION = 5500; // 5.5 secondes par image

// Éléments du DOM
const background = document.querySelector('.background');
const foreground = document.getElementById('foregroundImg') || document.querySelector('.foreground');
const audio = document.getElementById('backgroundMusic');
const popup = document.getElementById('popup');

// Éléments de la barre de navigation
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const nextBtn = document.getElementById('nextBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeIcon = document.getElementById('volumeIcon');
const downloadNavBtn = document.getElementById('downloadNavBtn');
const contactBtn = document.getElementById('contactBtn');

// Éléments de la modale de contact & toast
const contactModal = document.getElementById('contactModal');
const closeContactModal = document.getElementById('closeContactModal');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyBtnText = document.getElementById('copyBtnText');
const toastNotification = document.getElementById('toastNotification');

// ==========================================================================
// Gestion du Son et du Volume
// ==========================================================================
let lastVolume = 0.7;

function initAudioControls() {
    const savedVolume = localStorage.getItem('pigeon_volume');
    if (savedVolume !== null) {
        lastVolume = parseFloat(savedVolume);
    }
    audio.volume = lastVolume;
    volumeSlider.value = lastVolume;
    updateVolumeIcon(lastVolume);

    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        audio.volume = val;
        if (val > 0) {
            audio.muted = false;
            lastVolume = val;
        }
        localStorage.setItem('pigeon_volume', val);
        updateVolumeIcon(val);
        tryPlayAudio();
    });

    muteBtn.addEventListener('click', () => {
        if (audio.muted || audio.volume === 0) {
            audio.muted = false;
            const targetVol = lastVolume > 0 ? lastVolume : 0.7;
            audio.volume = targetVol;
            volumeSlider.value = targetVol;
            updateVolumeIcon(targetVol);
            showToast('Son activé');
        } else {
            lastVolume = audio.volume;
            audio.muted = true;
            volumeSlider.value = 0;
            updateVolumeIcon(0);
            showToast('Son coupé');
        }
        tryPlayAudio();
    });
}

function updateVolumeIcon(vol) {
    if (audio.muted || vol === 0) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
    } else if (vol < 0.5) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        `;
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        `;
    }
}

function tryPlayAudio() {
    if (audio.paused) {
        audio.play().catch(() => {});
    }
}

// ==========================================================================
// Gestion du Carrousel d'Images (Robuste avec détection d'erreurs)
// ==========================================================================

function getImagePath(index) {
    return `img/image${index}.jpg`;
}

let loadAttemptCounter = 0;

function displayImage(index, animate = true) {
    currentImageIndex = index;
    const newImagePath = getImagePath(currentImageIndex);

    // Préchargeur pour vérifier que l'image charge sans accroc
    const imgLoader = new Image();
    imgLoader.onload = () => {
        loadAttemptCounter = 0;
        if (!animate) {
            background.style.backgroundImage = `url("${newImagePath}")`;
            foreground.src = newImagePath;
            return;
        }

        background.style.opacity = '0.35';
        foreground.style.opacity = '0';

        setTimeout(() => {
            background.style.backgroundImage = `url("${newImagePath}")`;
            foreground.src = newImagePath;
            background.style.opacity = '1';
            foreground.style.opacity = '1';
        }, 300);
    };

    imgLoader.onerror = () => {
        // En cas de pépin sur une image, passe automatiquement à la suivante
        loadAttemptCounter++;
        if (loadAttemptCounter < 5) {
            nextImage();
        }
    };

    imgLoader.src = newImagePath;
}

function nextImage() {
    let nextIndex = currentImageIndex + 1;
    if (nextIndex > TOTAL_IMAGES) nextIndex = 1;
    displayImage(nextIndex);
}

function prevImage() {
    let prevIndex = currentImageIndex - 1;
    if (prevIndex < 1) prevIndex = TOTAL_IMAGES;
    displayImage(prevIndex);
}

function getRandomIndex() {
    return Math.floor(Math.random() * TOTAL_IMAGES) + 1;
}

function startCarousel() {
    stopCarousel();
    carouselInterval = setInterval(() => {
        let randomIndex;
        do {
            randomIndex = getRandomIndex();
        } while (randomIndex === currentImageIndex);
        displayImage(randomIndex);
    }, SLIDE_DURATION);
    isPlaying = true;
    updatePlayPauseButton();
}

function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    isPlaying = false;
    updatePlayPauseButton();
}

function togglePlayPause() {
    if (isPlaying) {
        stopCarousel();
        showToast('Défilement en pause');
    } else {
        startCarousel();
        showToast('Défilement repris');
    }
}

function updatePlayPauseButton() {
    if (!playPauseIcon) return;
    if (isPlaying) {
        playPauseIcon.innerHTML = `
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        `;
        playPauseBtn.title = "Mettre en pause";
    } else {
        playPauseIcon.innerHTML = `
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        `;
        playPauseBtn.title = "Lancer le défilement";
    }
}

// ==========================================================================
// Boîte Modale de Contact
// ==========================================================================
function openContact() {
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
}

function closeContact() {
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
}

function copyContactEmail() {
    const email = 'contact@pinou007.fr';
    navigator.clipboard.writeText(email).then(() => {
        copyBtnText.textContent = 'Copié !';
        copyEmailBtn.classList.add('copied');
        showToast('Adresse email copiée !');
        setTimeout(() => {
            copyBtnText.textContent = 'Copier';
            copyEmailBtn.classList.remove('copied');
        }, 2500);
    }).catch(() => {
        showToast('contact@pinou007.fr');
    });
}

// ==========================================================================
// Notifications Toast
// ==========================================================================
let toastTimer = null;
function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 2200);
}

// ==========================================================================
// Pop-up Téléchargement & Promotionnelle
// ==========================================================================
function openPopup() {
    popup.style.display = 'block';
}

function closePopup() {
    popup.style.display = 'none';
}

function showPopupOnce() {
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    if (!hasSeenPopup && window.innerWidth > 768) {
        openPopup();
        localStorage.setItem('hasSeenPopup', 'true');
    }
}

// ==========================================================================
// Écouteurs d'Événements
// ==========================================================================
function attachEventListeners() {
    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevImage();
        if (isPlaying) startCarousel();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextImage();
        if (isPlaying) startCarousel();
    });
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (downloadNavBtn) downloadNavBtn.addEventListener('click', openPopup);
    if (contactBtn) contactBtn.addEventListener('click', openContact);

    // Modale de contact
    if (closeContactModal) closeContactModal.addEventListener('click', closeContact);
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeContact();
        });
    }
    if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyContactEmail);

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContact();
            closePopup();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            nextImage();
            if (isPlaying) startCarousel();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
            if (isPlaying) startCarousel();
        } else if (e.key === 'm' || e.key === 'M') {
            muteBtn.click();
        }
    });

    // Lancer la musique au premier clic sur la page
    const startAudioOnce = () => {
        tryPlayAudio();
        document.removeEventListener('click', startAudioOnce);
        document.removeEventListener('touchstart', startAudioOnce);
    };
    document.addEventListener('click', startAudioOnce, { once: true });
    document.addEventListener('touchstart', startAudioOnce, { once: true });
}

// ==========================================================================
// Initialisation
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    initAudioControls();
    attachEventListeners();

    const initialIndex = getRandomIndex();
    displayImage(initialIndex, false);
    startCarousel();
    showPopupOnce();
});


