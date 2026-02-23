
document.addEventListener('DOMContentLoaded', () => {

    // --- Confetti (桜・紙吹雪ギミック) ---
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ffb6c1', '#d4bced', '#ffffff'] // 桜色、紫、白
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ffb6c1', '#d4bced', '#ffffff']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());

    // --- Bottom Navigation Active State ---
    const sections = document.querySelectorAll('.section, .hero-section');
    const navItems = document.querySelectorAll('.nav-item');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 半分見えたらアクティブにする
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-target') === id) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Smooth Scrolling for Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Gallery Logic (Dummy Data for now) ---
    const galleryGrid = document.getElementById('gallery-grid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    const dummyImages = [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518544801976-3e159e50e5fc?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop'
    ];

    dummyImages.forEach(src => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        const img = document.createElement('img');
        img.src = src;
        img.loading = 'lazy';
        item.appendChild(img);
        galleryGrid.appendChild(item);

        item.addEventListener('click', () => {
            lightboxImg.src = src.replace('w=400', 'w=1200'); // 拡大画像（高画質化のシミュレーション）
            lightbox.classList.add('active');
        });
    });

    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });


    // --- Message Board Logic (GAS連携) ---
    const messageForm = document.getElementById('message-form');
    const messagesList = document.getElementById('messages-list');
    const submitBtn = document.getElementById('submit-btn');

    // ▼ ユーザー様から提供いただいたGASのWeb App URL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzmgiUKLlgSB3HFa4h8zfqvRfTEnrygvRNlHkf-mXbfHHqPJJz-tdIYevaUNXgwhFJcxA/exec';

    // メッセージのロード
    const loadMessages = async () => {
        try {
            messagesList.innerHTML = '<div class="loading-messages"><i class="fa-solid fa-circle-notch fa-spin"></i> メッセージを読み込み中...</div>';

            const response = await fetch(GAS_URL);
            if (!response.ok) throw new Error('Network response was not ok');

            const result = await response.json();

            messagesList.innerHTML = ''; // ローディング消去

            if (result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(msg => {
                    addMessageToDOM(msg);
                });
            } else {
                messagesList.innerHTML = '<div class="loading-messages">まだメッセージがありません。最初のお祝いメッセージを書いてみませんか？</div>';
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesList.innerHTML = '<div class="loading-messages" style="color:red;">メッセージの読み込みに失敗しました。時間をおいて再読み込みしてください。</div>';
        }
    };

    const addMessageToDOM = (msg) => {
        const item = document.createElement('div');
        item.className = 'message-item';
        item.innerHTML = `
      <div class="message-header">
        <span class="message-name">${sanitizeHTML(msg.name)}</span>
        <span class="message-date">${msg.date}</span>
      </div>
      <div class="message-text">${sanitizeHTML(msg.text)}</div>
    `;
        // 先頭(上)に追加するか最後(下)に追加するかは、GAS側のソート順(新しい順)に依存
        // 今回GAS側で reverse() しているので append でOK
        messagesList.appendChild(item);
    };

    // 簡易サニタイズ
    const sanitizeHTML = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    };

    // 初期ロード実行
    loadMessages();

    // Form submit
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name').value;
        const textInput = document.getElementById('message').value;

        if (!nameInput.trim() || !textInput.trim()) return;

        // 送信中UIに変更
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 送信中...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain', // GAS側のCORS制限回避のためtext/plainを使用
                },
                body: JSON.stringify({
                    name: nameInput,
                    message: textInput
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // 送信成功したらフォームをリセットし、最新のリストを再取得する
                messageForm.reset();
                await loadMessages();
            } else {
                alert('送信に失敗しました: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting message:', error);
            alert('通信エラーが発生しました。ネットワーク状況を確認してください。');
        } finally {
            // UIを元に戻す
            submitBtn.innerHTML = '<span>送信する</span> <i class="fa-solid fa-paper-plane"></i>';
            submitBtn.disabled = false;
        }
    });

});
