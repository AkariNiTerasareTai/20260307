document.addEventListener('DOMContentLoaded', () => {

    // --- Core Routing (SPA) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');

    const navigateTo = (pageId) => {
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
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwaVnzKmdWe0hwVXAnqnLVGAWdD1ipyUMF0ffKH8VJgmJkr5FvBeShoDA0w8glTCrASsg/exec';
    const messagesList = document.getElementById('messages-list');
    const messageForm = document.getElementById('message-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageModal = document.getElementById('message-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Modal Control
    const openModal = () => {
        messageModal.style.display = 'grid';
        setTimeout(() => messageModal.classList.add('active'), 10);
        document.body.classList.add('no-scroll');
    };

    const closeModal = () => {
        messageModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            if (!messageModal.classList.contains('active')) {
                messageModal.style.display = 'none';
            }
        }, 300);
    };

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (messageModal) {
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) closeModal();
        });
    }

    const loadMessages = async () => {
        try {
            console.log('メッセージ読み込みを開始します...');
            messagesList.innerHTML = '<div class="loading-messages"><i class="fa-solid fa-circle-notch fa-spin"></i> メッセージを読み込み中...</div>';
            const fetchUrl = `${GAS_URL}?_t=${Date.now()}`;
            const response = await fetch(fetchUrl, {
                method: 'GET',
                redirect: 'follow',
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const result = await response.json();
            messagesList.innerHTML = '';

            if (result.status === 'success' && result.data.length > 0) {
                result.data.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'message-item';
                    item.innerHTML = `
                        <div class="message-header">
                            <span class="message-name">${sanitize(msg.name)}</span>
                        </div>
                        <div class="message-text">${sanitize(msg.text)}</div>
                    `;
                    messagesList.appendChild(item);
                });
            } else {
                messagesList.innerHTML = '<div class="loading-messages">まだメッセージがありません。</div>';
            }
        } catch (e) {
            console.error('メッセージの読み込み中にエラーが発生しました:', e);
            messagesList.innerHTML = `
                <div class="loading-messages" style="color:red;">
                    Failed to load messages.<br>
                    <small style="font-size: 0.8rem;">Error: ${e.message}</small><br>
                    <button onclick="location.reload()" style="margin-top:10px; padding:5px 10px; border-radius:5px; border:1px solid red; background:white; color:red; cursor:pointer;">再読み込み</button>
                </div>`;
        }
    };

    const sanitize = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\r?\n/g, '<br>');
    };

    let isSubmitting = false;

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const name = document.getElementById('name').value;
        const text = document.getElementById('message-input').value;

        isSubmitting = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
        submitBtn.disabled = true;

        try {
            const params = new URLSearchParams({
                name,
                message: text,
                key: 'akari_forever' // GAS側の書き込み制限解除用
            });
            const finalUrl = `${GAS_URL}?${params.toString()}`;

            // GASウェブアプリの仕様に合わせ、GETメソッド + no-cors + redirect follow を指定
            await fetch(finalUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                redirect: 'follow'
            });

            messageForm.reset();
            closeModal();

            // 少し待ってから読み込む（GAS側の反映ラグ対策）
            setTimeout(async () => {
                await loadMessages();
            }, 1000);

        } catch (err) {
            const params = new URLSearchParams({ name, message: text });
            const errorUrl = `${GAS_URL}?${params.toString()}`;
            alert(`送信中にエラーが発生しました。\nネットワーク状態を確認してください。\n\n調査用URL:\n${errorUrl}`);
        } finally {
            submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
            submitBtn.disabled = false;
            isSubmitting = false;
        }
    });


    // --- Initial Load & Event Listeners ---

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        navigateTo(hash);
    });

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

    // Initial page load
    const initialPage = window.location.hash.replace('#', '') || 'home';
    navigateTo(initialPage);

    // Trigger confetti only on first entry to home
    if (initialPage === 'home') runConfetti();

    // --- Scroll to Top ---
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

});
