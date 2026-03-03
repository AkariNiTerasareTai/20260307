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
        if (pageId === 'game') initGame();
        if (pageId === 'message') {
            loadMessages();
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
        for (let i = 1; i <= 79; i++) {    //ギャラリー画像枚数
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
        // 1. キャッシュがあれば表示
        const cachedData = localStorage.getItem('messages_cache');
        if (cachedData) {
            try {
                const cachedMessages = JSON.parse(cachedData);
                // キャッシュ表示時も未反映メッセージを考慮
                const pendingData = localStorage.getItem('pending_messages');
                let displayData = cachedMessages;
                if (pendingData) {
                    const pendingMessages = JSON.parse(pendingData).filter(m => (Date.now() - m.timestamp) < 300000);
                    displayData = [...pendingMessages, ...cachedMessages];
                }
                renderMessages(displayData);
            } catch (e) { console.error('Cache parse error', e); }
        } else {
            showSkeleton();
        }

        try {
            const fetchUrl = `${GAS_URL}?_t=${Date.now()}`;
            const response = await fetch(fetchUrl, { method: 'GET', redirect: 'follow', cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const result = await response.json();

            if (result.status === 'success') {
                const serverData = result.data;

                // 2. サーバーの最新状態をキャッシュに保存
                localStorage.setItem('messages_cache', JSON.stringify(serverData));

                // 3. pending_messages（自分が投稿した直後の未反映分）の管理
                let pendingData = localStorage.getItem('pending_messages');
                let pendingMessages = [];
                if (pendingData) {
                    const now = Date.now();
                    pendingMessages = JSON.parse(pendingData).filter(localMsg => {
                        // 5分以上経過したものは古いとみなして削除
                        if (now - localMsg.timestamp > 300000) return false;
                        // サーバー側に既に反映されていれば、pendingから削除
                        const isReflected = serverData.some(srvMsg =>
                            srvMsg.name === localMsg.name && srvMsg.text === localMsg.text
                        );
                        return !isReflected;
                    });
                    localStorage.setItem('pending_messages', JSON.stringify(pendingMessages));
                }

                // 4. 表示用データの作成（未反映メッセージ + サーバーデータ）
                const finalData = [...pendingMessages, ...serverData];
                renderMessages(finalData);
            }
        } catch (e) {
            console.error('Fetch error', e);
            // エラー時は既にキャッシュが表示されているはずだが、もしスケルトンなら何か出す
            if (!messagesList.querySelector('.message-item')) {
                messagesList.innerHTML = '<div class="loading-messages">メッセージの読み込みに失敗しました。</div>';
            }
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
            const optimisticMsg = {
                name: name || '名無し',
                text: text,
                date: new Date().toLocaleString(),
                timestamp: Date.now()
            };

            // 画面に即座に追加
            const newItem = document.createElement('div');
            newItem.className = 'message-item new-arrival';
            newItem.innerHTML = `<div class="message-header"><span class="message-name">${sanitize(optimisticMsg.name)}</span></div><div class="message-text">${sanitize(optimisticMsg.text)}</div>`;
            if (messagesList.querySelector('.loading-messages')) messagesList.innerHTML = '';
            messagesList.insertBefore(newItem, messagesList.firstChild);

            // pending_messages ストレージに保存
            const pendingData = localStorage.getItem('pending_messages');
            const pendingList = pendingData ? JSON.parse(pendingData) : [];
            pendingList.unshift(optimisticMsg);
            localStorage.setItem('pending_messages', JSON.stringify(pendingList));

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

        // 25%の確率で紫みを加える
        if (Math.random() < 0.25) {
            el.classList.add('purple');
        } else {
            el.classList.remove('purple');
        }
    };

    // --- Hero Section ---
    const initHero = () => {
        const bgContainer = document.getElementById('hero-background');
        const sakuraContainer = document.getElementById('sakura-container');
        if (!bgContainer) return;

        const bgImages = [];
        for (let i = 1; i <= 3; i++) { //トップ画像枚数
            const num = String(i).padStart(2, '0');
            bgImages.push(`./assets/top/top_${num}.JPG`);
        }
        const shuffledBgs = [...bgImages].sort(() => Math.random() - 0.5);
        shuffledBgs.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            if (index === 0) img.classList.add('active');
            bgContainer.appendChild(img);
        });

        let currentBgIndex = 0;
        const imgs = bgContainer.querySelectorAll('img');

        const mainHeader = document.querySelector('.main-header');

        const triggerNavShimmer = () => {
            if (!mainHeader) return;
            mainHeader.classList.remove('shimmer');
            // 一度外してから付け直す（連続トリガー対応）
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mainHeader.classList.add('shimmer');
                    mainHeader.addEventListener('animationend',
                        () => mainHeader.classList.remove('shimmer'), { once: true });
                });
            });
        };

        const transitionBg = () => {
            // 1. フェードアウト開始
            imgs[currentBgIndex].classList.remove('active');
            setTimeout(triggerNavShimmer, 1500);

            // 2. 暗転時間 3s を待ってから次を表示
            setTimeout(() => {
                currentBgIndex = (currentBgIndex + 1) % imgs.length;
                imgs[currentBgIndex].classList.add('active');

                // 3. 次の画像が表示されてから7秒後に次のサイクルを開始
                setTimeout(transitionBg, 7000);
            }, 3000);
        };

        // 初回実行（画像表示時間 7秒）
        setTimeout(transitionBg, 7000);

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

    // --- Game Section ---
    const quizUrls = [  //クイズリンク
        "https://x.com/Kareai_akari/status/2011444481753743806",
        "https://x.com/Kareai_akari/status/2011041711502610836",
        "https://x.com/Kareai_akari/status/1480497420291416074",
        "https://x.com/Kareai_akari/status/2006681818897195289",
        "https://x.com/Kareai_akari/status/2006319436186132539",
        "https://x.com/Kareai_akari/status/1748538210710630494",
        "https://x.com/Kareai_akari/status/1880132249733210543",
        "https://x.com/Kareai_akari/status/2012153940679487825",
        "https://x.com/Kareai_akari/status/1526906963392856065",
        "https://x.com/Kareai_akari/status/1521072755671973888",
        "https://x.com/kareai_akari/status/1705417153456046411",
        "https://x.com/kareai_akari/status/1721844340664758419",
        "https://x.com/kareai_akari/status/1720037148693532802",
        "https://x.com/kareai_akari/status/1714852862289924257",
        "https://x.com/kareai_akari/status/1783332228233322818",
        "https://x.com/kareai_akari/status/1996599558286070222",
        "https://x.com/kareai_akari/status/1851956978341548193",
        "https://x.com/kareai_akari/status/1867545565208498518",
        "https://x.com/kareai_akari/status/1963891950962053605",
        "https://x.com/kareai_akari/status/1786051213458563118",
        "https://x.com/Kareai_akari/status/1859195041471930574",
        "https://x.com/Kareai_akari/status/1841065712263352779",
        "https://x.com/Kareai_akari/status/2002368000889127301",
        "https://x.com/Kareai_akari/status/1716644651544068400",
        "https://x.com/Kareai_akari/status/1584180947230265345",
        "https://x.com/Kareai_akari/status/1641987308189794304",
        "https://x.com/Kareai_akari/status/1761720254676492316",
    ];

    let currentQuizData = null;
    let currentQuizIndex = -1;

    const fetchTwitterOembed = (url) => {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_twitter_' + Math.round(1000000 * Math.random());
            window[callbackName] = function (data) {
                delete window[callbackName];
                const scriptToRemove = document.getElementById(callbackName);
                if (scriptToRemove) document.body.removeChild(scriptToRemove);
                resolve(data);
            };
            const script = document.createElement('script');
            script.id = callbackName;
            script.src = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&lang=ja&callback=${callbackName}`;
            script.onerror = () => reject(new Error('JSONP Failed'));
            document.body.appendChild(script);
        });
    };

    const parseTwitterEmbed = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const pTag = doc.querySelector('p');
        if (!pTag) return null;

        // 最後に日付の取得を行うため先にaタグを全て取得しておく
        const aTags = doc.querySelectorAll('a');
        const dateStr = aTags[aTags.length - 1].textContent;

        // pタグ内のaタグについて、画像や短縮URLは削除し、ハッシュタグ等はテキスト化する
        const linksInP = pTag.querySelectorAll('a');
        linksInP.forEach(a => {
            if (a.textContent.includes('pic.twitter.com') || a.textContent.includes('https://t.co')) {
                a.remove();
            } else {
                const textNode = doc.createTextNode(a.textContent);
                a.parentNode.replaceChild(textNode, a);
            }
        });

        let rawHtml = pTag.innerHTML;

        let year, month, day;
        const jpMatch = dateStr.match(/(\d+)年(\d+)月(\d+)日/);

        if (jpMatch) {
            year = parseInt(jpMatch[1]);
            month = parseInt(jpMatch[2]);
            day = parseInt(jpMatch[3]);
        } else {
            const parsedD = new Date(dateStr);
            year = parsedD.getFullYear();
            month = parsedD.getMonth() + 1;
            day = parsedD.getDate();
        }

        // Return valid data format
        return {
            textHtml: rawHtml.trim(),
            year: year,
            month: month,
            day: day,
            embed: html
        };
    };

    const initGame = () => {
        const yearSelect = document.getElementById('quiz-year-select');
        const monthSelect = document.getElementById('quiz-month-select');
        const daySelect = document.getElementById('quiz-day-select');
        const submitBtn = document.getElementById('quiz-submit-btn');
        const nextBtn = document.getElementById('quiz-next-btn');

        if (!yearSelect.options.length || yearSelect.options.length === 1) {
            const currentYear = new Date().getFullYear();
            for (let y = 2022; y <= currentYear; y++) yearSelect.add(new Option(y + "年", y));
            for (let m = 1; m <= 12; m++) monthSelect.add(new Option(m + "月", m));
            for (let d = 1; d <= 31; d++) daySelect.add(new Option(d + "日", d));

            submitBtn.addEventListener('click', handleQuizSubmit);
            nextBtn.addEventListener('click', renderQuiz);
        }

        renderQuiz();
    };

    const renderQuiz = async () => {
        const qText = document.getElementById('quiz-question-text');
        qText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xの投稿から問題を自動生成中...';

        document.getElementById('quiz-year-select').value = "";
        document.getElementById('quiz-month-select').value = "";
        document.getElementById('quiz-day-select').value = "";
        document.getElementById('quiz-submit-btn').style.display = 'flex';
        document.getElementById('quiz-submit-btn').disabled = true;
        document.getElementById('quiz-result-area').style.display = 'none';
        document.getElementById('quiz-embed-container').innerHTML = '';
        document.getElementById('quiz-next-btn').style.display = 'none';

        const prevIndex = currentQuizIndex;
        if (quizUrls.length > 1) {
            do {
                currentQuizIndex = Math.floor(Math.random() * quizUrls.length);
            } while (currentQuizIndex === prevIndex);
        } else {
            currentQuizIndex = 0;
        }

        try {
            const oembedData = await fetchTwitterOembed(quizUrls[currentQuizIndex]);
            currentQuizData = parseTwitterEmbed(oembedData.html);
            if (currentQuizData) {
                qText.innerHTML = currentQuizData.textHtml;
                document.getElementById('quiz-submit-btn').disabled = false;
            } else {
                qText.innerHTML = "問題の取得に失敗しました。次の問題へ進んでください。";
                document.getElementById('quiz-next-btn').style.display = 'inline-flex';
                document.getElementById('quiz-submit-btn').style.display = 'none';
            }
        } catch (error) {
            qText.innerHTML = "Xからのデータ取得に失敗しました。ネットワークかURLを確認してください。";
            document.getElementById('quiz-next-btn').style.display = 'inline-flex';
            document.getElementById('quiz-submit-btn').style.display = 'none';
        }
    };

    const handleQuizSubmit = () => {
        const y = parseInt(document.getElementById('quiz-year-select').value);
        const m = parseInt(document.getElementById('quiz-month-select').value);
        const d = parseInt(document.getElementById('quiz-day-select').value);

        if (!y || !m || !d) {
            alert('年・月・日をすべて選択してください！');
            return;
        }

        const q = currentQuizData;
        const resultMsg = document.getElementById('quiz-result-message');
        const resultArea = document.getElementById('quiz-result-area');

        resultMsg.className = 'quiz-result-message';

        if (y === q.year && m === q.month && d === q.day) {
            resultMsg.innerHTML = '<i class="fa-solid fa-star"></i> 大・正・解！ <i class="fa-solid fa-star"></i>';
            resultMsg.classList.add('correct');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else if (y === q.year && m === q.month) {
            resultMsg.innerHTML = '<i class="fa-solid fa-face-surprise"></i> 月まで一致！惜しい！！ <i class="fa-solid fa-face-surprise"></i>';
            resultMsg.classList.add('almost');
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#f39c12', '#f1c40f'] });
        } else if (y === q.year) {
            resultMsg.innerHTML = '<i class="fa-solid fa-face-grin-beam-sweat"></i> 年だけあってる！惜しい！？ <i class="fa-solid fa-face-grin-beam-sweat"></i>';
            resultMsg.classList.add('almost');
        } else {
            resultMsg.innerHTML = '<i class="fa-solid fa-xmark"></i> 残念 <i class="fa-solid fa-xmark"></i>';
            resultMsg.classList.add('wrong');
        }

        document.getElementById('quiz-submit-btn').style.display = 'none';
        resultArea.style.display = 'block';

        const embedContainer = document.getElementById('quiz-embed-container');
        embedContainer.innerHTML = q.embed;
        document.getElementById('quiz-next-btn').style.display = 'inline-flex';

        if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load(embedContainer);
        }
    };

    // --- Profile Slider ---
    const initProfileSlider = () => {
        const track = document.getElementById('profile-slider-track');
        const dotsContainer = document.getElementById('slider-dots');
        const prevBtn = document.getElementById('slider-prev');
        const nextBtn = document.getElementById('slider-next');
        if (!track) return;

        // Calculate visible images based on date
        const startDate = new Date('2026-02-25T00:00:00+09:00');
        const now = new Date();
        const diffInDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        const visibleCount = Math.min(11, Math.max(1, diffInDays + 1));

        const images = [];
        for (let i = 0; i < visibleCount; i++) {
            const num = String(10 - i).padStart(2, '0');
            images.push(`./assets/profile/profile_${num}.JPG`);
        }

        if (images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            dotsContainer.style.display = 'none';
        }

        images.forEach((src, idx) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `柴咲あかり プロフィール ${idx + 1}`;
            track.appendChild(img);

            const dot = document.createElement('div');
            dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToSlide(idx));
            dotsContainer.appendChild(dot);
        });

        let currentIndex = images.length - 1; // 新しく追加された画像をデフォルト（最初）に表示
        const goToSlide = (index, instant = false) => {
            currentIndex = index;
            // Containerの正確な幅を取得してピクセル単位で移動（サブピクセルの隙間を防止）
            const containerWidth = track.parentElement.getBoundingClientRect().width;
            const gap = 20;
            if (instant) track.style.transition = 'none';
            track.style.transform = `translateX(-${index * (containerWidth + gap)}px)`;
            if (instant) {
                track.offsetHeight; // force reflow
                track.style.transition = '';
            }
            const dots = dotsContainer.querySelectorAll('.slider-dot');
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        };

        // 初期表示の設定（アニメーションなし）
        goToSlide(currentIndex, true);

        window.addEventListener('resize', () => goToSlide(currentIndex));

        prevBtn.addEventListener('click', () => {
            const newIndex = (currentIndex - 1 + images.length) % images.length;
            goToSlide(newIndex);
        });

        nextBtn.addEventListener('click', () => {
            const newIndex = (currentIndex + 1) % images.length;
            goToSlide(newIndex);
        });

        // Swipe support
        let startX = 0;
        track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextBtn.click();
                else prevBtn.click();
            }
        }, { passive: true });
    };



    // --- Final Initialization ---
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        navigateTo(hash);
    });

    const initialPage = window.location.hash.replace('#', '') || 'home';
    navigateTo(initialPage);
    initHero();
    initProfileSlider();

    const backToTopBtn = document.getElementById('back-to-top');
    let lastScrollY = window.scrollY;
    let scrollConfettiThrottle = false;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 300) backToTopBtn.classList.add('show');
        else backToTopBtn.classList.remove('show');

        // Scroll Confetti logic for Message and Gallery
        const hash = window.location.hash || '#home';
        if ((hash === '#message' || hash === '#gallery') && !scrollConfettiThrottle) {
            const diff = Math.abs(currentScrollY - lastScrollY);
            if (diff > 50) {
                scrollConfettiThrottle = true;
                const isScrollingDown = currentScrollY > lastScrollY;

                confetti({
                    particleCount: 5,
                    angle: isScrollingDown ? 60 : 120,
                    spread: 70,
                    origin: { x: Math.random(), y: isScrollingDown ? 0 : 1 },
                    colors: ['#A67BC4', '#FFBBDD', '#FFFFFF', '#FFD700'],
                    ticks: 300,
                    gravity: 0.8,
                    scalar: 1.2,
                    shapes: ['circle', 'square']
                });

                setTimeout(() => { scrollConfettiThrottle = false; }, 150);
            }
        }
        lastScrollY = currentScrollY;
    });
    backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

});
