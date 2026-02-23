
document.addEventListener('DOMContentLoaded', () => {

    // --- Core Routing (SPA) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');

    const navigateTo = (pageId) => {
        // Update URL hash without jumping
        window.history.pushState(null, null, `#${pageId}`);

        // Update UI
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === pageId) {
                section.classList.add('active');
                // Scroll to top when changing page
                window.scrollTo(0, 0);
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });

        // Trigger page-specific logic
        if (pageId === 'gallery') loadGallery();
        if (pageId === 'message') loadMessages();
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            navigateTo(pageId);
        });
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        navigateTo(hash);
    });

    // Initial page load
    const initialPage = window.location.hash.replace('#', '') || 'home';
    navigateTo(initialPage);


    // --- Confetti (Home Page) ---
    const runConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffb6c1', '#d4bced', '#ffffff']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffb6c1', '#d4bced', '#ffffff']
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    };

    if (initialPage === 'home') runConfetti();


    // --- Gallery: Dynamic & Random Appearance ---
    const galleryGrid = document.getElementById('gallery-grid');

    const loadGallery = () => {
        if (galleryGrid.querySelector('.gallery-card')) return;

        galleryGrid.innerHTML = '';

        // Generate local asset paths (served from root /assets)
        const localImages = [];
        for (let i = 1; i <= 153; i++) {
            const num = String(i).padStart(3, '0');
            localImages.push(`./assets/cameai_${num}.JPG`);
        }

        // Shuffle for randomness
        const shuffled = localImages.sort(() => Math.random() - 0.5);

        shuffled.forEach((src) => {
            const card = document.createElement('div');
            card.className = 'gallery-card';

            const delay = Math.random() * 0.5;
            card.style.transitionDelay = `${delay}s`;

            const img = document.createElement('img');
            img.src = src;
            img.loading = 'lazy';

            card.appendChild(img);
            galleryGrid.appendChild(card);

            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        card.classList.add('show');
                        obs.unobserve(card);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '100px' // Slightly earlier trigger for smoother reveal
            });

            obs.observe(card);

            card.addEventListener('click', () => openLightbox(src));
        });
    };

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.classList.remove('no-scroll');
        lightboxImg.style.transform = '';
        setTimeout(() => {
            if (!lightbox.classList.contains('active')) {
                lightbox.style.display = 'none';
            }
        }, 300);
    };

    const openLightbox = (src) => {
        lightboxImg.src = src;
        lightboxImg.style.transform = 'translate(0, 0)';
        lightboxImg.style.opacity = '1'; // 画像の透明度をリセット
        lightbox.style.opacity = '1';    // 背景の透明度をリセット
        lightbox.style.display = 'grid';
        document.body.classList.add('no-scroll');
        setTimeout(() => lightbox.classList.add('active'), 10);
    };

    // Swipe and Tap logic
    lightbox.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        lightboxImg.style.transition = 'none';
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || !lightbox.classList.contains('active')) return;

        // Prevent browser gestures (like pull-to-refresh)
        if (e.cancelable) e.preventDefault();

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Follow fingers in all directions
        lightboxImg.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Dynamic opacity based on distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        lightbox.style.opacity = Math.max(0, 1 - distance / 400);
    }, { passive: false }); // non-passive for preventDefault

    window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        lightboxImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 100) {
            // Significant move in any direction -> close
            closeLightbox();
        } else if (distance < 5) {
            // Almost no move -> tap anywhere to close
            closeLightbox();
        } else {
            // Small move -> snap back
            lightboxImg.style.transform = 'translate(0, 0)';
            lightbox.style.opacity = '1';
        }
    });

    // Support for Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });


    // --- Message Board ---
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwxSFNYhUOPqI8egAIGLqWQhm9kUtSoUdGZNBDKwpYaRIiJx7LTHC7LofpSjQZRmubJ6w/exec';
    const messagesList = document.getElementById('messages-list');
    const messageForm = document.getElementById('message-form');
    const submitBtn = document.getElementById('submit-btn');

    const loadMessages = async () => {
        try {
            messagesList.innerHTML = '<div class="loading-messages"><i class="fa-solid fa-circle-notch fa-spin"></i> メッセージを読み込み中...</div>';
            const response = await fetch(GAS_URL, { redirect: "follow" });
            if (!response.ok) throw new Error('Network error');

            const result = await response.json();
            messagesList.innerHTML = '';

            if (result.status === 'success' && result.data.length > 0) {
                result.data.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'message-item';
                    item.innerHTML = `
                        <div class="message-header">
                            <span class="message-name">${sanitize(msg.name)}</span>
                            <span class="message-date en">${msg.date}</span>
                        </div>
                        <div class="message-text">${sanitize(msg.text)}</div>
                    `;
                    messagesList.appendChild(item);
                });
            } else {
                messagesList.innerHTML = '<div class="loading-messages">まだメッセージがありません。</div>';
            }
        } catch (e) {
            messagesList.innerHTML = '<div class="loading-messages" style="color:red;">Failed to load messages.</div>';
        }
    };

    const sanitize = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const text = document.getElementById('message-input').value;

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
        submitBtn.disabled = true;

        try {
            const params = new URLSearchParams({ name, message: text });
            const res = await fetch(`${GAS_URL}?${params.toString()}`);
            const result = await res.json();
            if (result.status === 'success') {
                messageForm.reset();
                await loadMessages();
            }
        } catch (err) {
            alert('送信エラーが発生しました。');
        } finally {
            submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
            submitBtn.disabled = false;
        }
    });

});
