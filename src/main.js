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
            item.innerHTML = `
                <div class="skeleton-name"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            `;
            fragment.appendChild(item);
        }
        messagesList.innerHTML = '';
        messagesList.appendChild(fragment);
    };

    const loadMessages = async () => {
        try {
            console.log('メッセージ読み込みを開始します...');

            // サーバーからデータを取得
            const fetchUrl = `${GAS_URL}?_t=${Date.now()}`;
            const response = await fetch(fetchUrl, {
                method: 'GET',
                redirect: 'follow',
                cache: 'no-cache'
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const result = await response.json();

            if (result.status === 'success') {
                // サーバーの最新データ
                let serverData = result.data;

                // localStorageからデータを取得し、サーバーデータとマージ
                // (サーバーにまだ載っていない自分のメッセージを保持し続ける)
                const cachedData = localStorage.getItem('messages_cache');
                if (cachedData) {
                    const localMessages = JSON.parse(cachedData);

                    // サーバーデータに含まれていないローカルメッセージのみを抽出
                    // ※簡易的な判定として、nameとtextのペアが一致するかでチェック
                    const pendingMessages = localMessages.filter(localMsg =>
                        !serverData.some(srvMsg => srvMsg.name === localMsg.name && srvMsg.text === localMsg.text)
                    );

                    // 未反映のメッセージがあれば、サーバーデータの先頭に追加
                    if (pendingMessages.length > 0) {
                        console.log(`${pendingMessages.length}件の未反映メッセージを保持します`);
                        serverData = [...pendingMessages, ...serverData];
                    }
                }

                localStorage.setItem('messages_cache', JSON.stringify(serverData));
                renderMessages(serverData);
                console.log('データを更新しました');
            }
        } catch (e) {
            console.error('メッセージの読み込み中にエラーが発生しました:', e);
            const cachedData = localStorage.getItem('messages_cache');
            if (cachedData) {
                renderMessages(JSON.parse(cachedData));
            } else {
                showSkeleton();
            }
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

        const nameInput = document.getElementById('name');
        const messageInput = document.getElementById('message-input');
        const name = nameInput.value;
        const text = messageInput.value;

        isSubmitting = true;

        // 1. 送信中状態への移行
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
        submitBtn.disabled = true;

        try {
            const params = new URLSearchParams({
                name,
                message: text,
                key: 'akari_forever'
            });
            const finalUrl = `${GAS_URL}?${params.toString()}`;

            // 2. HTTPリクエスト開始
            const fetchPromise = fetch(finalUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                redirect: 'follow'
            });

            // 3. 楽観的UI (Optimistic UI): 送信完了を待たずに画面に追加
            const optimisticMsg = {
                name: name || '名無し',
                text: text,
                date: new Date().toLocaleString()
            };

            // 現在の表示の先頭に挿入
            const newItem = document.createElement('div');
            newItem.className = 'message-item new-arrival';
            newItem.innerHTML = `
                <div class="message-header">
                    <span class="message-name">${sanitize(optimisticMsg.name)}</span>
                </div>
                <div class="message-text">${sanitize(optimisticMsg.text)}</div>
            `;

            // メッセージリストが空の場合の「まだありません」を消去
            if (messagesList.querySelector('.loading-messages')) {
                messagesList.innerHTML = '';
            }
            messagesList.insertBefore(newItem, messagesList.firstChild);

            // localStorage にも保存しておく（最新データ取得時に消えないように）
            const cachedData = localStorage.getItem('messages_cache');
            const currentCache = cachedData ? JSON.parse(cachedData) : [];
            localStorage.setItem('messages_cache', JSON.stringify([optimisticMsg, ...currentCache]));

            // Fetchの終了を待つ
            await fetchPromise;

            // 4. 送信完了の視覚的フィードバック
            submitBtn.classList.add('success');
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> 送信完了！';

            // 送信完了を感じてもらうために少し待ってからモーダルを閉じる
            setTimeout(() => {
                messageForm.reset();
                closeModal();

                // ボタンの状態を元に戻しておく
                submitBtn.classList.remove('success');
                submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
                submitBtn.disabled = false;
                isSubmitting = false;

                // バックグラウンドで最新データを取得（整合性確保）
                loadMessages();
            }, 1500);

        } catch (err) {
            console.error('Submission error:', err);
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>メッセージを贈る</span> <i class="fa-solid fa-paper-plane"></i>';
            alert('送信中にエラーが発生しました。ネットワーク状態を確認してください。');
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
