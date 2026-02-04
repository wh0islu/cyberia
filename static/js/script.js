document.addEventListener('DOMContentLoaded', () => {
    function setupMobileMenu() {
        const menuToggleBtn = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuToggleBtn && mobileMenu) {
            menuToggleBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
    function setupThemeToggle() {
        const themeToggleButtons = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');
        const darkIcons = document.querySelectorAll('#theme-toggle-dark-icon, #theme-toggle-dark-icon-mobile');
        const lightIcons = document.querySelectorAll('#theme-toggle-light-icon, #theme-toggle-light-icon-mobile');
        function applyTheme(isDark) {
            if (isDark) {
                document.documentElement.classList.add('dark');
                lightIcons.forEach(icon => icon.classList.remove('hidden'));
                darkIcons.forEach(icon => icon.classList.add('hidden'));
            } else {
                document.documentElement.classList.remove('dark');
                lightIcons.forEach(icon => icon.classList.add('hidden'));
                darkIcons.forEach(icon => icon.classList.remove('hidden'));
            }
        }
        function loadTheme() {
            const savedThemeIsDark = localStorage.getItem('theme') === 'dark';
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = savedThemeIsDark || (localStorage.getItem('theme') === null && systemPrefersDark);
            applyTheme(isDark);
        }
        themeToggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const isCurrentlyDark = document.documentElement.classList.contains('dark');
                const newThemeIsDark = !isCurrentlyDark;
                localStorage.setItem('theme', newThemeIsDark ? 'dark' : 'light');
                applyTheme(newThemeIsDark);
            });
        });
        loadTheme();
    }

    function setupTypingEffect() {
        const typingElement = document.getElementById('typing-effect');
        if (!typingElement) return;

        const textToType = "cyberia";
        const typingSpeed = 150;
        const erasingSpeed = 100;
        const pauseAfterTyping = 3000;
        const pauseAfterErasing = 1000;
        let charIndex = 0;

        function type() {
            if (charIndex < textToType.length) {
                typingElement.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(type, typingSpeed);
            } else {
                setTimeout(erase, pauseAfterTyping);
            }
        }

        function erase() {
            if (charIndex > 0) {
                typingElement.textContent = textToType.substring(0, charIndex - 1);
                charIndex--;
                setTimeout(erase, erasingSpeed);
            } else {
                setTimeout(type, pauseAfterErasing);
            }
        }
        setTimeout(type, pauseAfterErasing);
    }
    function setupCarousel(carouselId) {
        const track = document.getElementById(`${carouselId}-carousel-track`);
        const prevBtn = document.getElementById(`${carouselId}-prev-btn`);
        const nextBtn = document.getElementById(`${carouselId}-next-btn`);
        if (!track || !prevBtn || !nextBtn) return;
        let currentIndex = 0;
        let cardWidth = 0;

        function calculateCardWidth() {
            if (track.children.length > 0) cardWidth = track.children[0].getBoundingClientRect().width;
        }

        function updateCarousel() {
            if (cardWidth === 0) calculateCardWidth();
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }

        function handleResize() {
            if (window.innerWidth >= 768) {
                track.style.transition = 'none';
                calculateCardWidth();
                currentIndex = 0;
                updateCarousel();
                track.offsetHeight;
                track.style.transition = 'transform 500ms ease-in-out';
            }
        }

        if (window.innerWidth >= 768) {
            calculateCardWidth();
            track.style.transition = 'transform 500ms ease-in-out';
        }

        nextBtn.addEventListener('click', () => {
            if (window.innerWidth < 768) return;
            const maxIndex = track.children.length - 2;
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (window.innerWidth < 768) return;
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        window.addEventListener('resize', handleResize);
    }
    function setupAntiInspect() {
        document.addEventListener('contextmenu', event => event.preventDefault());

        document.addEventListener('keydown', event => {
            if (event.code === "F12") {
                event.preventDefault();
            }
        });
    }


    setupMobileMenu();
    setupThemeToggle();
    setupTypingEffect();
    setupCarousel('projetos');
    setupCarousel('reconhecimentos');
    setupAntiInspect();
});
