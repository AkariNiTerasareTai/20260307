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
        if (pageId === 'message') {
            loadMessages();
            initMessageDecorations();
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            navigateTo(pageId);
        });
    });

    // --- Gallery ---
    const galleryGrid = document.getElementById('gallery-grid');
    const loadGallery = () => {
        if (galleryGrid.querySelector('.gallery-card')) return;
        galleryGrid.innerHTML = '';
        const localImages = [];
        for (let i = 1; i <= 153; i++) {
            const num = String(i).padStart(3, '0');
            localImages.push(`./assets/cameai_${num}.JPG`);
        }
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
            }, { threshold: 0.1, rootMargin: '100px' });
            obs.observe(card);
            card.addEventListener('click', () => openLightbox(src));
        });
    };

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    let startX = 0, startY = 0, isDragging = false;

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.classList.remove('no-scroll');
        lightboxImg.style.transform = '';
        setTimeout(() => { if (!lightbox.classList.contains('active')) lightbox.style.display = 'none'; }, 300);
    };

    const openLightbox = (src) => {
        lightboxImg.src = src;
        lightboxImg.style.transform = 'translate(0, 0)';
        lightboxImg.style.opacity = '1';
        lightbox.style.opacity = '1';
        lightbox.style.display = 'grid';
        document.body.classList.add('no-scroll');
        setTimeout(() => lightbox.classList.add('active'), 10);
    };

    lightbox.addEventListener('pointerdown', (e) => {
        startX = e.clientX; startY = e.clientY;
        isDragging = true;
        lightboxImg.style.transition = 'none';
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || !lightbox.classList.contains('active')) return;
        if (e.cancelable) e.preventDefault();
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        lightboxImg.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        lightbox.style.opacity = Math.max(0, 1 - distance / 400);
    }, { passive: false });

    window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        lightboxImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > 100 || distance < 5) closeLightbox();
        else {
            lightboxImg.style.transform = 'translate(0, 0)';
            lightbox.style.opacity = '1';
        }
    });

    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox(); });

    // --- Message Board ---
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwaVnzKmdWe0hwVXAnqnLVGAWdD1ipyUMF0ffKH8VJgmJkr5FvBeShoDA0w8glTCrASsg/exec';
    const messagesList = document.getElementById('messages-list');
    const messageForm = document.getElementById('message-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageModal = document.getElementById('message-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const openModal = () => {
        messageModal.style.display = 'grid';
        setTimeout(() => messageModal.classList.add('active'), 10);
        document.body.classList.add('no-scroll');
    };

    const closeModal = () => {
        messageModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        setTimeout(() => { if (!messageModal.classList.contains('active')) messageModal.style.display = 'none'; }, 300);
    };

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (messageModal) {
        messageModal.addEventListener('click', (e) => { if (e.target === messageModal) closeModal(); });
    }

    const renderMessages = (data) => {
        const fragment = document.createDocumentFragment();
        if (data.length > 0) {
            data.forEach(msg => {
                const item = document.createElement('div');
                item.className = 'message-item';
                item.innerHTML = `
                    <div class="message-header">
                        <span class="message-name">${sanitize(msg.name)}</span>
                    </div>
                    <div class="message-text">${sanitize(msg.text)}</div>
                `;
                fragment.appendChild(item);
            });
            messagesList.innerHTML = '';
            messagesList.appendChild(fragment);
        } else {
            messagesList.innerHTML = '<div class="loading-messages">まだメッセージがありません。</div>';
        }
    };

    const showSkeleton = () => {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = 'skeleton-item';
            item.innerHTML = '<div class="skeleton-name"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div>';
            fragment.appendChild(item);
        }
        messagesList.innerHTML = '';
        messagesList.appendChild(fragment);
    };

    const loadMessages = async () => {
        try {
            const fetchUrl = `${GAS_URL}?_t=${Date.now()}`;
            const response = await fetch(fetchUrl, { method: 'GET', redirect: 'follow', cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const result = await response.json();
            if (result.status === 'success') {
                let serverData = result.data;
                const cachedData = localStorage.getItem('messages_cache');
                if (cachedData) {
                    const localMessages = JSON.parse(cachedData);
                    const pendingMessages = localMessages.filter(localMsg =>
                        !serverData.some(srvMsg => srvMsg.name === localMsg.name && srvMsg.text === localMsg.text)
                    );
                    if (pendingMessages.length > 0) serverData = [...pendingMessages, ...serverData];
                }
                localStorage.setItem('messages_cache', JSON.stringify(serverData));
                renderMessages(serverData);
            }
        } catch (e) {
            const cachedData = localStorage.getItem('messages_cache');
            if (cachedData) renderMessages(JSON.parse(cachedData));
            else showSkeleton();
        }
    };

    const sanitize = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\r?\n/g, '<br>');
    };

    let isSubmitting = false;
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const nameInput = document.getElementById('name');
        const messageInput = document.getElementById('message-input');
        const name = nameInput.value;
        const text = messageInput.value;
        isSubmitting = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
        submitBtn.disabled = true;
        try {
            const params = new URLSearchParams({ name, message: text, key: 'akari_forever' });
            const fetchPromise = fetch(`${GAS_URL}?${params.toString()}`, { method: 'GET', mode: 'no-cors', cache: 'no-cache', redirect: 'follow' });
            const optimisticMsg = { name: name || '名無し', text: text, date: new Date().toLocaleString() };
            const newItem = document.createElement('div');
            newItem.className = 'message-item new-arrival';
            newItem.innerHTML = `<div class="message-header"><span class="message-name">${sanitize(optimisticMsg.name)}</span></div><div class="message-text">${sanitize(optimisticMsg.text)}</div>`;
            if (messagesList.querySelector('.loading-messages')) messagesList.innerHTML = '';
            messagesList.insertBefore(newItem, messagesList.firstChild);
            const cachedData = localStorage.getItem('messages_cache');
            const currentCache = cachedData ? JSON.parse(cachedData) : [];
            localStorage.setItem('messages_cache', JSON.stringify([optimisticMsg, ...currentCache]));
            await fetchPromise;
            submitBtn.classList.add('success');
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> 送信完了！';
            setTimeout(() => {
                messageForm.reset(); closeModal();
                submitBtn.classList.remove('success');
                submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
                submitBtn.disabled = false; isSubmitting = false;
                loadMessages();
            }, 1500);
        } catch (err) {
            isSubmitting = false; submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
            alert('送信中にエラーが発生しました。');
        }
    });

    // --- SHARED HELPER FUNCTIONS ---
    const resetSakura = (el) => {
        const size = Math.random() * 10 + 10;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.animationDuration = `${Math.random() * 5 + 5}s`;
        el.style.animationDelay = `${Math.random() * 5}s`;
        el.style.opacity = Math.random() * 0.5 + 0.3;
    };

    const resetFloatItem = (el) => {
        const size = Math.random() * 20 + 20;
        el.style.fontSize = `${size}px`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.animationDuration = `${Math.random() * 10 + 10}s`;
        el.style.animationDelay = `${Math.random() * -20}s`; // Negative delay to start mid-animation

        el.addEventListener('animationiteration', () => {
            el.style.left = `${Math.random() * 100}%`;
        });
    };

    // --- Hero Section ---
    const initHero = () => {
        const bgContainer = document.getElementById('hero-background');
        const sakuraContainer = document.getElementById('sakura-container');
        if (!bgContainer) return;

        const bgImages = ['./assets/cameai_001.JPG', './assets/cameai_091.JPG', './assets/cameai_113.JPG', './assets/cameai_125.JPG', './assets/cameai_150.JPG'];
        const shuffledBgs = [...bgImages].sort(() => Math.random() - 0.5);
        shuffledBgs.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            if (index === 0) img.classList.add('active');
            bgContainer.appendChild(img);
        });

        let currentBgIndex = 0;
        const imgs = bgContainer.querySelectorAll('img');
        setInterval(() => {
            imgs[currentBgIndex].classList.remove('active');
            currentBgIndex = (currentBgIndex + 1) % imgs.length;
            imgs[currentBgIndex].classList.add('active');
        }, 8000);

        for (let i = 0; i < 30; i++) {
            const petal = document.createElement('div');
            petal.className = 'sakura';
            resetSakura(petal);
            sakuraContainer.appendChild(petal);
        }

        const targetBirthday = new Date('2026-03-07T00:00:00').getTime();
        const targetGraduation = new Date('2026-03-22T17:15:00').getTime();

        const updateCountdown = () => {
            const now = Date.now();
            const calc = (target, prefix) => {
                const diff = target - now;
                const containerId = `countdown-${prefix === 'b' ? 'birthday' : 'graduation'}`;
                const container = document.getElementById(containerId);
                if (diff <= 0) {
                    if (!container.classList.contains('celebrated')) {
                        container.classList.add('celebrated');
                        const label = container.querySelector('.countdown-label');
                        if (label) { label.textContent = prefix === 'b' ? '2026.3.7' : '2026.3.22'; label.style.fontSize = '1.2rem'; }
                        const timer = container.querySelector('.countdown-timer');
                        if (timer) timer.innerHTML = `<p style="font-size: 2rem; color: #fff; text-shadow: 0 0 10px var(--primary-light); font-weight: 800;">Happy ${prefix === 'b' ? 'Birthday' : 'Graduation'}!!</p>`;
                    }
                    return;
                }
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                document.getElementById(`${prefix}-days`).textContent = String(d).padStart(2, '0');
                document.getElementById(`${prefix}-hours`).textContent = String(h).padStart(2, '0');
                document.getElementById(`${prefix}-mins`).textContent = String(m).padStart(2, '0');
                document.getElementById(`${prefix}-secs`).textContent = String(s).padStart(2, '0');
            };
            calc(targetBirthday, 'b'); calc(targetGraduation, 'g');
        };
        setInterval(updateCountdown, 1000); updateCountdown();

        document.addEventListener('mousemove', (e) => {
            if (window.location.hash !== '' && window.location.hash !== '#home') return;
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            const content = document.querySelector('.hero-content');
            if (content) content.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    };

    // --- Message Decorations ---
    const initMessageDecorations = () => {
        const container = document.getElementById('message-decorations');
        if (!container) return;
        container.innerHTML = '';
        const emojis = ['💜', '⭐', '🎁', '👑', '✨', '💖'];
        for (let i = 0; i < 30; i++) {
            const item = document.createElement('div');
            item.className = 'float-item';
            item.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            resetFloatItem(item);
            container.appendChild(item);
        }
    };

    // --- Final Initialization ---
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        navigateTo(hash);
    });

    const initialPage = window.location.hash.replace('#', '') || 'home';
    navigateTo(initialPage);
    initHero();

    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backToTopBtn.classList.add('show');
        else backToTopBtn.classList.remove('show');
    });
    backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

});
