// Carousel functionality
let currentSlide = 0;
const slideLinks = document.querySelectorAll('.carousel-slide-link');
const totalSlides = slideLinks.length;

function showSlide(n) {
    slideLinks.forEach(link => link.classList.remove('active'));
    slideLinks[n].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

// Auto-rotate carousel every 10 seconds
setInterval(nextSlide, 10000);

// Modal/Lightbox functionality
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalClose = document.querySelector('.modal-close');
const modalPrev = document.querySelector('.modal-prev');
const modalNext = document.querySelector('.modal-next');
const imageCounter = document.getElementById('imageCounter');

const promoImages = [
    'images/promo1.jpg',
    'images/promo2.jpg',
    'images/promo3.jpg',
    'images/promo4.jpg',
    'images/promo5.jpg',
    'images/promo6.jpg',
    'images/promo7.jpg',
    'images/promo8.jpg',
    'images/promo9.jpg'
];

let currentModalImage = 0;

// Open modal when clicking on carousel images
slideLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        currentModalImage = index;
        openModal();
    });
});

function openModal() {
    modal.classList.add('active');
    updateModalImage();
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function updateModalImage() {
    modalImage.src = promoImages[currentModalImage];
    imageCounter.textContent = `${currentModalImage + 1} / ${promoImages.length}`;
}

function nextModalImage() {
    currentModalImage = (currentModalImage + 1) % promoImages.length;
    updateModalImage();
}

function prevModalImage() {
    currentModalImage = (currentModalImage - 1 + promoImages.length) % promoImages.length;
    updateModalImage();
}

// Modal event listeners
modalClose.addEventListener('click', closeModal);
modalPrev.addEventListener('click', prevModalImage);
modalNext.addEventListener('click', nextModalImage);

// Close modal when clicking outside the image
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft') {
        prevModalImage();
    } else if (e.key === 'ArrowRight') {
        nextModalImage();
    } else if (e.key === 'Escape') {
        closeModal();
    }
});

// Touch/Swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextModalImage();
        } else {
            prevModalImage();
        }
    }
}

// Countdown Timer
function updateCountdown() {
    const timer = setInterval(() => {
        const now = new Date();
        const today = new Date(now);
        today.setHours(23, 59, 59, 999);
        
        const timeRemaining = today - now;

        if (timeRemaining <= 0) {
            // Reset for the next day
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = '23:59:59';
            }
            return;
        }

        const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
        const seconds = Math.floor((timeRemaining / 1000) % 60);

        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

// Initialize countdown on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    if (slideLinks.length > 0) {
        showSlide(0);
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

