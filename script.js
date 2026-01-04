// 1. Değişken Tanımlamaları
let questions = []; // Sorular buraya dolacak
let currentQuestionIndex = 0;
let timeLeft = 45 * 60; // 45 dakika (saniye cinsinden)
let timerInterval;
let userAnswers = new Array(50).fill(null); // Kullanıcının cevaplarını tutacak (A, B, C, D veya null)
let visitedQuestions = []; // Hangi soruların görüntülendiğini tutacak
let currentFontSize = 17; // Varsayılan font boyutu (px)
let soundEnabled = true; // Ses efektleri durumu

// 2. Sınavı Başlatan Fonksiyon
async function startExam(category) {
    // Yeni sınav için değişkenleri ve zamanlayıcıyı sıfırla
    timeLeft = 45 * 60;
    document.getElementById('time-left').innerText = '45:00';
    document.getElementById('time-left').parentElement.classList.remove('warning'); // Uyarıyı kaldır
    if (timerInterval) clearInterval(timerInterval);
    localStorage.removeItem('examState'); // Yeni sınav başlarken eski kaydı sil

    try {
        // API Simülasyonu: Genişletilmiş veri setini çek
        const allQuestions = await fetchMockQuestions();
        
        // Kategoriye göre filtrele ve karıştır
        let filteredQuestions = [];
        if (category === 'mixed') {
            filteredQuestions = allQuestions;
            document.getElementById('category-name').innerText = "Karışık Sınav";
        } else {
            filteredQuestions = allQuestions.filter(q => q.category === category);
            document.getElementById('category-name').innerText = category;
        }

        // Soruları karıştır (Shuffle) ve maksimum 50 soru al
        questions = filteredQuestions.sort(() => 0.5 - Math.random()).slice(0, 50);

        // Veriler başarıyla geldiyse arayüzü hazırla
        document.getElementById('menu-screen').classList.add('hidden'); // Menüyü gizle
        document.getElementById('exam-screen').classList.remove('hidden'); // Sınavı göster
        
        userAnswers = new Array(questions.length).fill(null); // Soru sayısına göre cevap dizisi oluştur
        visitedQuestions = new Array(questions.length).fill(false); // Ziyaret edilenleri sıfırla
        createNavigationGrid();
        showQuestion(0);
        startTimer();
    } catch (error) {
        console.error("Sorular yüklenirken hata oluştu:", error);
        alert("Soru veritabanı yüklenemedi!");
    }
}

// 3. Soruyu Ekrana Basan Fonksiyon
function showQuestion(index) {
    currentQuestionIndex = index;
    visitedQuestions[index] = true; // Bu soru görüntülendi olarak işaretle
    
    // Soru numarasını güncelle
    document.getElementById('question-number').innerText = `Soru: ${index + 1} / 50`;
    
    // Soru metni ve şıklar
    const q = questions[index];
    if (q) {
        document.getElementById('question-text').innerText = q.question;
        
        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = ''; // Eski şıkları temizle

        q.options.forEach((option, i) => {
            const letter = String.fromCharCode(65 + i); // 0->A, 1->B...
            const button = document.createElement('button');
            button.className = 'option-item';
            
            if (userAnswers[index] !== null) {
                button.disabled = true; // Cevap verildiyse butonları kilitle
                if (userAnswers[index] === i) button.classList.add('selected');
            }
            
            button.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${option}</span>
            `;
            button.onclick = () => selectOption(index, i);
            optionsContainer.appendChild(button);
        });
    }
    
    updateNavigationStatus();

    // Animasyon Tetikleme (Slide Effect)
    const questionBox = document.querySelector('.question-box');
    const optionsGrid = document.getElementById('options');
    
    questionBox.classList.remove('slide-animation');
    optionsGrid.classList.remove('slide-animation');
    
    void questionBox.offsetWidth; // Reflow (yeniden çizim) tetikle
    
    questionBox.classList.add('slide-animation');
    optionsGrid.classList.add('slide-animation');
}

// 4. Şık Seçme Fonksiyonu
function selectOption(qIndex, optionIndex) {
    if (userAnswers[qIndex] !== null) return; // Zaten cevaplandıysa değiştirmeyi engelle
    userAnswers[qIndex] = optionIndex; // Cevabı kaydet
    saveExamState(); // Her cevapta kaydet
    showQuestion(qIndex); // Ekranı güncelle (seçili hali göstermek için)
}

// 5. Yan Menü (1-50) Navigasyon Paneli
function createNavigationGrid() {
    const grid = document.getElementById('question-navigation');
    grid.innerHTML = '';
    for (let i = 0; i < questions.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('nav-dot');
        dot.id = `nav-dot-${i}`;
        dot.innerText = i + 1;
        dot.onclick = () => showQuestion(i);
        grid.appendChild(dot);
    }
}

// 6. Hangi soruların çözüldüğünü panelde göster
function updateNavigationStatus() {
    userAnswers.forEach((answer, i) => {
        const dot = document.getElementById(`nav-dot-${i}`);
        if (dot) {
            // Önce tüm sınıfları temizle (active hariç, o aşağıda yönetiliyor)
            dot.classList.remove('answered', 'empty');

            if (answer !== null) dot.classList.add('answered'); // Cevaplandıysa renk değiştir
            else if (visitedQuestions[i]) dot.classList.add('empty'); // Görüntülendi ama cevaplanmadıysa sarı yap
            
            if (i === currentQuestionIndex) dot.classList.add('active'); // Şu anki soruyu vurgula
            else dot.classList.remove('active');
        }
    });
}

// 7. Zamanlayıcı
function startTimer() {
    const totalTime = 45 * 60;
    const circle = document.getElementById('timer-progress');
    const circumference = 251; // 2 * pi * 40

    // Dairesel çubuğu güncelleme fonksiyonu
    const updateTimerCircle = () => {
        const offset = circumference - ((timeLeft / totalTime) * circumference);
        circle.style.strokeDashoffset = offset;
    };

    updateTimerCircle(); // Başlangıçta hemen güncelle

    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        const timerElement = document.getElementById('time-left');
        timerElement.innerText = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        updateTimerCircle(); // Her saniye güncelle

        // 5 dakika (300 saniye) altı kontrolü
        if (timeLeft < 300) {
            timerElement.parentElement.classList.add('warning');
        }
        saveExamState(); // Her saniye durumu kaydet

        if (timeLeft <= 0) finishExam();
    }, 1000);
}

// 8. Sınavı Bitir ve Sonuçları Hesapla
function finishExam() {
    clearInterval(timerInterval);
    localStorage.removeItem('examState'); // Sınav bittiğinde kaydı sil
    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q, i) => {
        if (userAnswers[i] !== null) {
            if (userAnswers[i] === q.correct) correctCount++;
            else wrongCount++;
        }
    });

    // Sonuç Ekranını Doldur ve Göster
    document.getElementById('correct-count').innerText = correctCount;
    document.getElementById('wrong-count').innerText = wrongCount;
    
    // Başarı Durumu ve Mesajı (%70 Barajı)
    const score = Math.round((correctCount / questions.length) * 100);
    document.getElementById('score-value').innerText = score;
    
    // Puan kutucuğunun rengini güncelle
    const scoreBox = document.getElementById('score-value').closest('.stat-item');
    scoreBox.classList.remove('score', 'success', 'danger');

    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const circle = document.getElementById('score-circle');
    let progressColor = '#7d2ae8'; // Varsayılan

    if (score >= 70) {
        progressColor = '#27ae60'; // Yeşil
        scoreBox.classList.add('success');
        resultTitle.innerText = "Tebrikler! 🥳";
        resultMessage.innerText = "Sınav sonucunuz: Başarılı!";
        resultMessage.style.color = "#27ae60";
        startConfetti(); // Başarılıysa konfeti patlat
        playResultSound(true); // Başarı sesi
    } else {
        progressColor = '#c0392b'; // Kırmızı
        scoreBox.classList.add('danger');
        resultTitle.innerText = "Başarısız Oldunuz 😔";
        resultMessage.innerText = "Sınav sonucunuz: Maalesef barajı geçemediniz.";
        resultMessage.style.color = "#c0392b";
        stopConfetti(); // Başarısızsa konfeti varsa temizle
        playResultSound(false); // Başarısızlık sesi
    }

    // Dairesel İlerleme Çubuğunu Güncelle
    circle.style.background = `conic-gradient(${progressColor} ${score * 3.6}deg, var(--track-color) 0deg)`;

    // --- YENİ: Sonucu Geçmişe Kaydet ---
    const examResult = {
        date: new Date().toLocaleString('tr-TR'),
        category: document.getElementById('category-name').innerText,
        score: score,
        correct: correctCount,
        wrong: wrongCount
    };

    const history = JSON.parse(localStorage.getItem('examHistory')) || [];
    history.push(examResult);
    localStorage.setItem('examHistory', JSON.stringify(history));
    // -----------------------------------

    const timeSpent = (45 * 60) - timeLeft;
    const m = Math.floor(timeSpent / 60);
    const s = timeSpent % 60;
    document.getElementById('time-spent').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    document.getElementById('result-screen').classList.remove('hidden');
}

// 9. Ana Menüye Dönüş
function returnToMenu() {
    stopConfetti(); // Konfetiyi durdur
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('exam-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    updateMenuProgress(); // Menüye dönünce ilerlemeyi güncelle
    checkSavedExam(); // Menüye dönünce kayıt var mı kontrol et
}

// 10. Cevapları İncele
function reviewAnswers() {
    stopConfetti(); // Konfetiyi durdur
    const reviewContent = document.getElementById('review-content');
    reviewContent.innerHTML = '';
    
    let hasWrong = false;

    questions.forEach((q, i) => {
        const userAnswer = userAnswers[i];
        // Sadece yanlış cevaplananları göster (Boş bırakılanlar hariç)
        if (userAnswer !== null && userAnswer !== q.correct) {
            hasWrong = true;
            const div = document.createElement('div');
            div.className = 'review-item';
            div.innerHTML = `
                <div class="review-question"><strong>${i + 1}.</strong> ${q.question}</div>
                <div class="review-option user-wrong"><strong>Senin Cevabın:</strong> ${q.options[userAnswer]}</div>
                <div class="review-option correct"><strong>Doğru Cevap:</strong> ${q.options[q.correct]}</div>
            `;
            reviewContent.appendChild(div);
        }
    });

    if (!hasWrong) {
        reviewContent.innerHTML = '<p style="text-align:center; padding:20px;">Harika! İşaretlediğin sorularda hiç yanlışın yok.</p>';
    }

    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
}

function closeReview() {
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
}

// 15. Geçmiş Sınavları Listele
function showHistory() {
    const historyContent = document.getElementById('history-content');
    historyContent.innerHTML = '';
    
    const history = JSON.parse(localStorage.getItem('examHistory')) || [];
    
    // En yeniden en eskiye sırala
    history.reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const scoreClass = item.score >= 70 ? 'pass' : 'fail';
        
        div.innerHTML = `
            <div class="history-info">
                <h4>${item.category}</h4>
                <div class="history-date">${item.date}</div>
                <div style="font-size: 0.9rem; margin-top:5px;">D: ${item.correct} / Y: ${item.wrong}</div>
            </div>
            <div class="history-score ${scoreClass}">
                ${item.score}
            </div>
        `;
        historyContent.appendChild(div);
    });

    if (history.length === 0) {
        historyContent.innerHTML = '<p style="text-align:center; padding:20px;">Henüz tamamlanmış bir sınavınız yok.</p>';
    }

    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
}

// 11. Gece Modu Değiştirme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-toggle-modal');
    if (document.body.classList.contains('dark-mode')) {
        btn.innerText = '☀️';
    } else {
        btn.innerText = '🌙';
    }
}

// 23. Ses Efektleri Aç/Kapa
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle-modal');
    if (btn) {
        btn.innerText = soundEnabled ? '🔊' : '🔇';
    }
    localStorage.setItem('soundEnabled', soundEnabled);
}

// 16. Font Boyutu Değiştirme (Erişilebilirlik)
function changeFontSize(step) {
    currentFontSize += step;
    
    // Sınırlar (Minimum 12px, Maksimum 26px)
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 26) currentFontSize = 26;

    // CSS Değişkenini Güncelle
    document.querySelector('.app-wrapper').style.setProperty('--dynamic-font-size', `${currentFontSize}px`);
    
    // Tercihi Kaydet
    localStorage.setItem('fontSizePreference', currentFontSize);
}

// 17. Tam Ekran Modu
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

// 18. Ayarlar Menüsü
function openSettings() {
    const resetRow = document.getElementById('reset-exam-row');
    // Sadece sınav ekranı açıksa bu seçeneği göster
    if (!document.getElementById('exam-screen').classList.contains('hidden')) {
        resetRow.style.display = 'flex';
    } else {
        resetRow.style.display = 'none';
    }
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// 21. Sınavı Sıfırla ve Çık
function resetExam() {
    if (confirm("Sınavı sonlandırıp ana menüye dönmek istediğinize emin misiniz? Mevcut ilerlemeniz silinecektir.")) {
        closeSettings();
        clearInterval(timerInterval);
        localStorage.removeItem('examState'); // Kaydı sil
        document.getElementById('exam-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        checkSavedExam(); // Devam et butonunu güncelle
    }
}

// 12. Sınav Durumunu Kaydet (LocalStorage)
function saveExamState() {
    const state = {
        questions,
        currentQuestionIndex,
        timeLeft,
        userAnswers,
        visitedQuestions,
        categoryName: document.getElementById('category-name').innerText
    };
    localStorage.setItem('examState', JSON.stringify(state));
}

// 13. Kayıtlı Sınavı Devam Ettir
function resumeExam() {
    const savedState = JSON.parse(localStorage.getItem('examState'));
    if (!savedState) return;

    if (timerInterval) clearInterval(timerInterval);

    questions = savedState.questions;
    currentQuestionIndex = savedState.currentQuestionIndex;
    timeLeft = savedState.timeLeft;
    userAnswers = savedState.userAnswers;
    visitedQuestions = savedState.visitedQuestions;
    
    document.getElementById('category-name').innerText = savedState.categoryName;
    
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('exam-screen').classList.remove('hidden');
    
    createNavigationGrid();
    showQuestion(currentQuestionIndex);
    startTimer();
}

// 14. Kayıtlı Sınav Kontrolü
function checkSavedExam() {
    const hasSavedExam = localStorage.getItem('examState');
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        if (hasSavedExam) resumeBtn.classList.remove('hidden');
        else resumeBtn.classList.add('hidden');
    }

    // Font tercihini yükle
    const savedFontSize = localStorage.getItem('fontSizePreference');
    if (savedFontSize) {
        currentFontSize = parseInt(savedFontSize);
        document.querySelector('.app-wrapper').style.setProperty('--dynamic-font-size', `${currentFontSize}px`);
    }

    // Ses tercihini yükle
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        const btn = document.getElementById('sound-toggle-modal');
        if (btn) btn.innerText = soundEnabled ? '🔊' : '🔇';
    }

    updateMenuProgress(); // Sayfa yüklendiğinde ilerlemeyi göster
}

// 25. Ana Menü İlerleme Çubuklarını Güncelle
function updateMenuProgress() {
    const history = JSON.parse(localStorage.getItem('examHistory')) || [];
    
    // Kategorilere göre en yüksek puanları hesapla
    const maxScores = {
        'Trafik ve Çevre Bilgisi': 0,
        'Trafik Adabı': 0,
        'Motor Bilgisi': 0,
        'İlk Yardım': 0,
        'mixed': 0 // Karışık sınav için
    };

    history.forEach(exam => {
        // Kategori ismini eşleştir (Karışık sınavın adı "Karışık Sınav" olarak kaydediliyor olabilir)
        let key = exam.category;
        if (key === 'Karışık Sınav') key = 'mixed';

        if (maxScores.hasOwnProperty(key)) {
            if (exam.score > maxScores[key]) {
                maxScores[key] = exam.score;
            }
        }
    });

    // Çemberleri güncelle
    const updateRing = (id, score) => {
        const circle = document.getElementById(id);
        if (!circle) return;
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // --- TAÇ İKONU EKLEME (%100 Başarı) ---
        const pathNode = circle.closest('.path-node');
        if (pathNode) {
            const existingCrown = pathNode.querySelector('.crown-icon');
            if (existingCrown) existingCrown.remove();

            if (score === 100) {
                const crown = document.createElement('div');
                crown.className = 'crown-icon';
                crown.innerText = '👑';
                pathNode.appendChild(crown);
            }
        }
    };

    updateRing('prog-trafik-cevre', maxScores['Trafik ve Çevre Bilgisi']);
    updateRing('prog-trafik-adabi', maxScores['Trafik Adabı']);
    updateRing('prog-motor', maxScores['Motor Bilgisi']);
    updateRing('prog-ilkyardim', maxScores['İlk Yardım']);
    updateRing('prog-mixed', maxScores['mixed']);

    // --- AVATAR KONUMLANDIRMA ---
    const categories = [
        'Trafik ve Çevre Bilgisi',
        'Trafik Adabı',
        'Motor Bilgisi',
        'İlk Yardım',
        'mixed'
    ];

    let activeIndex = 0;
    // %100 olmayan ilk kategoriyi bul (Kullanıcının kaldığı yer)
    for (let i = 0; i < categories.length; i++) {
        if (maxScores[categories[i]] < 100) {
            activeIndex = i;
            break;
        }
        if (i === categories.length - 1) activeIndex = i; // Hepsi bittiyse sonda kal
    }

    const pathItems = document.querySelectorAll('.path-item');
    const avatar = document.getElementById('user-avatar');
    
    if (pathItems[activeIndex] && avatar) {
        const targetNode = pathItems[activeIndex].querySelector('.path-node');
        if (targetNode !== avatar.parentElement) {
            targetNode.appendChild(avatar);
        }
    }
    
    // Yolu çiz (Gecikmeli çağır ki layout otursun)
    setTimeout(drawZigzagPath, 50);
}

// 26. Yol Haritası Çizgisi (SVG Zigzag)
function drawZigzagPath() {
    const container = document.querySelector('.learning-path');
    const nodes = document.querySelectorAll('.path-node');
    const path = document.getElementById('zigzag-path');
    
    if (!container || nodes.length === 0 || !path) return;

    // Konteynerin konumunu al
    const containerRect = container.getBoundingClientRect();
    let d = "";

    nodes.forEach((node, index) => {
        const nodeRect = node.getBoundingClientRect();
        
        // Merkezin konteyner içindeki göreceli koordinatlarını hesapla
        const x = nodeRect.left - containerRect.left + nodeRect.width / 2;
        const y = nodeRect.top - containerRect.top + nodeRect.height / 2;

        if (index === 0) {
            if (d === "") {
                d += `M ${x} ${y}`;
            }
        } else {
            const prevNode = nodes[index - 1];
            const prevRect = prevNode.getBoundingClientRect();
            const prevX = prevRect.left - containerRect.left + prevRect.width / 2;
            const prevY = prevRect.top - containerRect.top + prevRect.height / 2;

            // Bezier eğrisi kontrol noktaları (Dikey akış için)
            const distY = y - prevY;
            const cp1x = prevX;
            const cp1y = prevY + distY * 0.5;
            const cp2x = x;
            const cp2y = y - distY * 0.5;

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
        }
    });

    path.setAttribute('d', d);
}

// 20. Konfeti Efekti
function startConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = ''; // Önce temizle
    const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22'];

    for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.classList.add('confetti');
        div.style.left = Math.random() * 100 + '%';
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        div.style.animationDuration = (Math.random() * 2 + 2) + 's'; // 2-4 saniye arası düşüş
        div.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(div);
    }
}

function stopConfetti() {
    const container = document.getElementById('confetti-container');
    if(container) container.innerHTML = '';
}

// Butonlara olay dinleyicileri ekle
document.getElementById('next-btn').onclick = () => { if(currentQuestionIndex < questions.length - 1) showQuestion(currentQuestionIndex + 1); };
document.getElementById('prev-btn').onclick = () => { if(currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1); };
document.getElementById('finish-exam-btn').onclick = () => { if(confirm("Sınavı bitirmek istediğinize emin misiniz?")) finishExam(); };

// Tam ekran değişimini dinle ve ikonu güncelle
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreen-toggle-modal');
    if (document.fullscreenElement) {
        btn.innerText = '✖';
        btn.title = "Tam Ekrandan Çık";
    } else {
        btn.innerText = '⛶';
        btn.title = "Tam Ekran";
    }
});

// Pencere boyutlandığında yolu yeniden çiz
window.addEventListener('resize', drawZigzagPath);

// Sayfa yüklendiğinde (HTML parse edildiğinde) başlat - Daha hızlı açılış
document.addEventListener('DOMContentLoaded', checkSavedExam);

// 27. Gizlilik Politikası
function openPrivacyPolicy() {
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('privacy-modal').classList.remove('hidden');
}

function closePrivacyPolicy() {
    document.getElementById('privacy-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('hidden');
}

// --- API SİMÜLASYONU VE GENİŞLETİLMİŞ VERİ SETİ ---
// Gerçek bir API yerine, genişletilmiş bir soru havuzunu simüle ediyoruz.
const MOCK_DATA = [
    // --- TRAFİK VE ÇEVRE BİLGİSİ (1-50) ---
    { id: 1, category: "Trafik ve Çevre Bilgisi", question: "Aralıklı olarak yanıp sönen kırmızı ışıkta sürücü ne yapmalıdır?", options: ["Yavaşlayıp yolu kontrol ederek geçmelidir", "Durmalı, trafik uygunsa devam etmelidir", "Yeşil ışık yanıncaya kadar durmalıdır", "Durmadan dikkatli geçmelidir"], correct: 1 },
    { id: 2, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi trafik kazalarında 'asli kusur' sayılan hallerdendir?", options: ["Hız sınırlarına uymamak", "Takip mesafesine uymamak", "Arkadan çarpmak", "Alkollü araç kullanmak"], correct: 2 },
    { id: 3, category: "Trafik ve Çevre Bilgisi", question: "Öndeki aracı güvenle takip etmek için kullanılan '88-89' kuralı neyi belirlemeye yarar?", options: ["Fren mesafesini", "Takip mesafesini", "İntikal mesafesini", "Durş mesafesini"], correct: 1 },
    { id: 4, category: "Trafik ve Çevre Bilgisi", question: "Kavşaklarda geçiş hakkı kurallarına göre, aşağıdakilerden hangisi doğrudur?", options: ["Tali yoldaki araç, ana yoldaki araca yol vermelidir", "Dönüş yapan araç, düz giden araca yol vermemelidir", "Hızlı olan araç önce geçmelidir", "Kamyonlar otomobillere yol vermelidir"], correct: 0 },
    { id: 5, category: "Trafik ve Çevre Bilgisi", question: "Yerleşim yeri içinde otomobiller için azami hız sınırı saatte kaç kilometredir?", options: ["30", "50", "70", "90"], correct: 1 },
    { id: 6, category: "Trafik ve Çevre Bilgisi", question: "Trafik görevlisinin kollarını yana açması ne anlama gelir?", options: ["Bütün yönlere dur", "Kolların gösterdiği yöndeki trafiğe yol açık", "Ön ve arka trafikteki araçlar beklemeli", "Hızlan"], correct: 1 },
    { id: 7, category: "Trafik ve Çevre Bilgisi", question: "Hususi otomobillerin muayenesi kaç yılda bir yapılır?", options: ["1", "2", "3", "4"], correct: 1 },
    { id: 8, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi araçta bulundurulması zorunlu gereçlerden biridir?", options: ["Yangın söndürme cihazı", "Güneş gözlüğü", "Su bidonu", "Yedek parça"], correct: 0 },
    { id: 9, category: "Trafik ve Çevre Bilgisi", question: "Geçiş üstünlüğüne sahip araçların (Ambulans, İtfaiye vb.) görev halinde karşılaşmaları durumunda geçiş sıralaması nasıl olmalıdır?", options: ["İtfaiye - Ambulans - Polis", "Ambulans - İtfaiye - Polis", "Polis - Ambulans - İtfaiye", "Ambulans - Polis - İtfaiye"], correct: 1 },
    { id: 10, category: "Trafik ve Çevre Bilgisi", question: "Şerit değiştirmek isteyen sürücü, öncesinde ne yapmalıdır?", options: ["Kornaya basmalıdır", "Hızını arttırmalıdır", "Niyetini sinyalle bildirmelidir", "Frene basmalıdır"], correct: 2 },
    { id: 11, category: "Trafik ve Çevre Bilgisi", question: "Alkollü içki içen bir sürücünün kandaki alkol miktarı en az kaç promil olursa araç kullanması yasaktır (Hususi otomobil)?", options: ["0.20", "0.30", "0.40", "0.50"], correct: 3 },
    { id: 12, category: "Trafik ve Çevre Bilgisi", question: "Dönel kavşakta geriye dönüşlerde aşağıdakilerden hangisinin yapılması yasaktır?", options: ["Ada etrafında dönerken gereksiz şerit değiştirilmesi", "Dönüş sonrası hızının gerektirdiği şeride girilmesi", "Orta adaya bitişik şeritten dönüşe geçilmesi", "Sağa ve sola dönüş kurallarına uyulması"], correct: 0 },
    { id: 13, category: "Trafik ve Çevre Bilgisi", question: "Araçların durma ve duraklaması gereken haller dışında bırakılmasına ne denir?", options: ["Bekleme", "Park etme", "Duraklama", "Trafikten men"], correct: 1 },
    { id: 14, category: "Trafik ve Çevre Bilgisi", question: "Geceleyin öndeki aracı yakından takip ederken hangi ışıkların yakılması zorunludur?", options: ["Uzun hüzmeli farlar", "Sis ışıkları", "Yakını gösteren farlar", "Acil uyarı ışıkları"], correct: 2 },
    { id: 15, category: "Trafik ve Çevre Bilgisi", question: "Trafik işaret levhalarına zarar veren sorumluya ne uygulanır?", options: ["Hapis cezası", "Trafikten men cezası", "Zarar karşılıkları ve masraf ödetilir", "Sürücü belgesi geri alınır"], correct: 2 },
    { id: 16, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, trafik denetiminde istenmesi halinde sürücünün göstermek zorunda olduğu belgelerdendir?", options: ["Gümrük giriş belgesi", "İthalat belgesi", "Tescil Belgesi", "İşletme belgesi"], correct: 2 },
    { id: 17, category: "Trafik ve Çevre Bilgisi", question: "Şekildeki trafik işaretini gören sürücü ne yapmalıdır?", options: ["Hızını artırmalıdır", "Geriye dönmelidir", "Hızını azaltmalıdır", "Yolun en solundan gitmelidir"], correct: 2 },
    { id: 18, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi duraklanan veya park edilen yerden çıkan araç sürücüsünün uyması gereken kurallardan biri değildir?", options: ["Işıkla veya kolla çıkış işareti vermesi", "Aracını ve aracının etrafını kontrol etmesi", "Yoldan geçen araç sürücülerini ikaz edip yavaşlatması", "Sakıncalı bir durum yoksa manevraya başlaması"], correct: 2 },
    { id: 19, category: "Trafik ve Çevre Bilgisi", question: "Aksine bir işaret yoksa, eğimsiz iki yönlü dar yolda, otomobil ile iş makinesinin karşılaşması halinde, hangisi diğerine yol vermelidir?", options: ["İş makinesi otomobile", "Otomobil iş makinesine", "Şeridi daralmış olan diğerine", "Dingil ağırlığı az olan diğerine"], correct: 0 },
    { id: 20, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, trafik kazalarında sürücü için asli kusurlu sayılacak hallerdendir?", options: ["Gerekli tedbirleri alarak araç çekmek", "Araçta reflektör bulundurmamak", "Kurallara uygun olarak park etmiş araçlara çarpmak", "Sürüş sırasında sigara içmek"], correct: 2 },
    { id: 21, category: "Trafik ve Çevre Bilgisi", question: "Hangi durumda aracın camları kırılır?", options: ["Kaza anında kapılar açılmıyorsa", "Klima çalışmıyorsa", "Radyo çekmiyorsa", "Silecekler çalışmıyorsa"], correct: 0 },
    { id: 22, category: "Trafik ve Çevre Bilgisi", question: "Otoyollarda, aksi bir işaret yoksa, minibüs ve otobüsler için azami hız sınırı saatte kaç kilometredir?", options: ["80", "90", "100", "110"], correct: 2 },
    { id: 23, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların tescil işlemlerini yaparak belge ve plakalarını vermekle görevlidir?", options: ["Sağlık Bakanlığı", "Milli Eğitim Bakanlığı", "Emniyet Genel Müdürlüğü", "Karayolları Genel Müdürlüğü"], correct: 2 },
    { id: 24, category: "Trafik ve Çevre Bilgisi", question: "Kaza yerindeki yaralı, sağlık kuruluşuna ne zaman sevk edilir?", options: ["Yakınları geldikten sonra", "Hiçbir müdahale yapılmadan önce", "Kendine gelmesi sağlandıktan sonra", "Hayati tehlikelerine karşı önlem alındıktan sonra"], correct: 3 },
    { id: 25, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, trafik çevre kirliliğini önlemek için alınacak tedbirlerdendir?", options: ["Korna çalmanın yasak olduğu yerlerde korna çalmak", "Araç bakımlarının zamanında yapılması", "Araçtan dışarı çöp atılması", "Araçların gereksiz yere çalışır halde tutulması"], correct: 1 },
    { id: 26, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, kara yollarında meydana gelen trafik kazaları ile ilgili ilk ve acil yardım hizmetlerini planlar ve uygular?", options: ["Adalet Bakanlığı", "Sağlık Bakanlığı", "Ulaştırma Bakanlığı", "İçişleri Bakanlığı"], correct: 1 },
    { id: 27, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların muayene süresi dolmasa bile, muayenesinin yapılması zorunludur?", options: ["Kazaya karışması sonucu yetkili görevli tarafından gerekli görülmesi halinde", "Sürücüsü veya işleticisi değiştiğinde", "Motoru bakımdan geçirildiğinde", "Sahibi istediğinde"], correct: 0 },
    { id: 28, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, sürücülerden beklenen olumlu davranış özelliklerindendir?", options: ["Kızgın biçimde kornaya basmak", "Sürüş sırasında aceleci davranmak", "Başkasının hakkına saygı göstermek", "Dar yolda gelen araçlarla inatlaşmak"], correct: 2 },
    { id: 29, category: "Trafik ve Çevre Bilgisi", question: "Trafik işaret levhaları ile belirlenmiş yaya ve okul geçitlerine yaklaşan sürücülerin aşağıdakilerden hangisini yapmaları yanlıştır?", options: ["Yavaşlamaları", "Hızlarını artırmaları", "Yayalar varsa durmaları", "İlk geçiş hakkını yayalara vermeleri"], correct: 1 },
    { id: 30, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araç kullanırken öfke duygusuna kapılan bir sürücünün kendisini sakinleştirmek için uygulaması gereken yöntemlerden biri değildir?", options: ["Trafik ortamında gerilimi artıracak durumların üstüne gitmesi", "Derin nefes alması", "Radyo veya müzik açması", "Mola vermesi"], correct: 0 },
    { id: 31, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, trafik kazasında asli kusur sayılır?", options: ["Kırmızı ışıkta geçmek", "Taşıma sınırının üstünde yük taşımak", "Zorunlu olmadıkça aracını yavaş sürmek", "Sürücü belgesini yanında bulundurmamak"], correct: 0 },
    { id: 32, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların nerede park edileceğini belirleyen işaret levhalarıdır?", options: ["Tehlike uyarı işaretleri", "Tanzim işaretleri", "Bilgi işaretleri", "Durma ve park etme işaretleri"], correct: 3 },
    { id: 33, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, sürücülerin trafik kazalarına karışmalarının nedenlerinden biri değildir?", options: ["Kural ihlali yapmaları", "Dikkatsiz davranmaları", "Araç bakımlarını zamanında yaptırmaları", "Alkollü araç kullanmaları"], correct: 2 },
    { id: 34, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, trafik kazası sonrası olay yerinde yapılması gereken işlemlerdendir?", options: ["Kaza yerindeki iz ve delillerin yok edilmesi", "Kaza yapan araçların yerlerinin değiştirilmesi", "Kaza yerinin güvenliğinin sağlanması", "Yaralıların hemen araçtan çıkarılması"], correct: 2 },
    { id: 35, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, geçiş üstünlüğüne sahip araçların sürülmesi sırasında uyulması gereken kurallardandır?", options: ["Hız sınırlarına uyulmaması", "Trafik işaretlerine uyulmaması", "Can ve mal güvenliğinin tehlikeye sokulmaması", "Sadece görev halindeyken geçiş üstünlüğü hakkının kullanılması"], correct: 3 },
    { id: 36, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların yüklenmesi sırasında dikkat edilmesi gereken hususlardandır?", options: ["Yükün kasa dışına taşacak şekilde yüklenmesi", "Yükün üzerine yolcu bindirilmesi", "Yükün dengeli bir şekilde yüklenmesi", "Yükün sürücünün görüşünü engelleyecek şekilde yüklenmesi"], correct: 2 },
    { id: 37, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların hızlarını azaltmaları gereken yerlerden değildir?", options: ["Kavşaklar", "Dönemeçler", "Tepe üstleri", "Otoyollar"], correct: 3 },
    { id: 38, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların takip mesafesini belirleyen faktörlerden değildir?", options: ["Aracın hızı", "Yolun durumu", "Hava durumu", "Aracın rengi"], correct: 3 },
    { id: 39, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların manevra yapmaları sırasında dikkat etmeleri gereken hususlardandır?", options: ["Manevraya başlamadan önce çevre kontrolü yapılması", "Manevra sırasında hızın artırılması", "Manevra sırasında sinyal verilmemesi", "Manevra sırasında diğer araçların engellenmesi"], correct: 0 },
    { id: 40, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların duraklamaları sırasında dikkat etmeleri gereken hususlardandır?", options: ["Duraklama süresinin 5 dakikayı geçmemesi", "Duraklama sırasında motorun durdurulması", "Duraklama sırasında aracın terk edilmesi", "Duraklama sırasında diğer araçların engellenmesi"], correct: 0 },
    { id: 41, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların park etmeleri sırasında dikkat etmeleri gereken hususlardandır?", options: ["Park yerinin uygun olması", "Park süresinin sınırsız olması", "Park sırasında aracın çalışır durumda bırakılması", "Park sırasında el freninin çekilmemesi"], correct: 0 },
    { id: 42, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların ışıklarının kullanılması ile ilgili doğru bir bilgidir?", options: ["Gündüzleri sis lambalarının yakılması", "Geceleri sadece park lambalarının yakılması", "Geceleri karşılaşmalarda kısa hüzmeli farların yakılması", "Tünellerde farların yakılmaması"], correct: 2 },
    { id: 43, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların kornalarının kullanılması ile ilgili doğru bir bilgidir?", options: ["Gereksiz yere korna çalınması", "Kornanın uyarı amaçlı kullanılması", "Kornanın selamlaşma amaçlı kullanılması", "Kornanın sürekli çalınması"], correct: 1 },
    { id: 44, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların lastiklerinin kontrol edilmesi ile ilgili doğru bir bilgidir?", options: ["Lastiklerin havasının her gün kontrol edilmesi", "Lastiklerin diş derinliğinin kontrol edilmemesi", "Lastiklerin sadece patladığında değiştirilmesi", "Lastiklerin havasının gözle kontrol edilmesi"], correct: 0 },
    { id: 45, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların frenlerinin kontrol edilmesi ile ilgili doğru bir bilgidir?", options: ["Fren hidroliğinin seviyesinin kontrol edilmesi", "Fren balatalarının kontrol edilmemesi", "Frenlerin sadece tutmadığında kontrol edilmesi", "Frenlerin ses yapmasının normal olması"], correct: 0 },
    { id: 46, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların motor yağının kontrol edilmesi ile ilgili doğru bir bilgidir?", options: ["Motor yağının seviyesinin kontrol edilmesi", "Motor yağının renginin kontrol edilmemesi", "Motor yağının sadece eksildiğinde eklenmesi", "Motor yağının hiç değiştirilmemesi"], correct: 0 },
    { id: 47, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların soğutma suyunun kontrol edilmesi ile ilgili doğru bir bilgidir?", options: ["Soğutma suyunun seviyesinin kontrol edilmesi", "Soğutma suyunun antifrizli olmaması", "Soğutma suyunun sadece yazın kontrol edilmesi", "Soğutma suyunun hiç değiştirilmemesi"], correct: 0 },
    { id: 48, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların aküsünün kontrol edilmesi ile ilgili doğru bir bilgidir?", options: ["Akünün kutup başlarının temiz olması", "Akünün su seviyesinin kontrol edilmemesi", "Akünün sadece bittiğinde değiştirilmesi", "Akünün hiç şarj edilmemesi"], correct: 0 },
    { id: 49, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların emniyet kemerinin kullanılması ile ilgili doğru bir bilgidir?", options: ["Emniyet kemerinin sadece sürücü tarafından takılması", "Emniyet kemerinin sadece ön koltukta oturanlar tarafından takılması", "Emniyet kemerinin tüm yolcular tarafından takılması", "Emniyet kemerinin şehir içinde takılmaması"], correct: 2 },
    { id: 50, category: "Trafik ve Çevre Bilgisi", question: "Aşağıdakilerden hangisi, araçların çocuk koltuğunun kullanılması ile ilgili doğru bir bilgidir?", options: ["Çocuk koltuğunun sadece uzun yolda kullanılması", "Çocuk koltuğunun ön koltukta kullanılması", "Çocuk koltuğunun çocuğun yaşına ve kilosuna uygun olması", "Çocuk koltuğunun hiç kullanılmaması"], correct: 2 },

    // --- TRAFİK ADABI (51-100) ---
    { id: 51, category: "Trafik Adabı", question: "Trafikte 'Empati' kurmak ne demektir?", options: ["Kendi haklarını zorla almak", "Kendini karşıdaki sürücünün yerine koymak", "Sürekli korna çalmak", "Kuralları ihlal etmek"], correct: 1 },
    { id: 52, category: "Trafik Adabı", question: "Bir sürücünün trafik ortamında yaptığı hangi davranış 'diğerkamlık' (özgecilik) örneğidir?", options: ["Kendi geçiş hakkını başka sürücüye vermesi", "Sürekli sol şeridi işgal etmesi", "Kırmızı ışıkta geçmesi", "Yayalara su sıçratması"], correct: 0 },
    { id: 53, category: "Trafik Adabı", question: "Trafikte hangi değerin eksikliği, sürücünün öfkelenmesine ve agresifleşmesine yol açar?", options: ["Hoşgörü", "Hız tutkusu", "Bencillik", "İnatçılık"], correct: 0 },
    { id: 54, category: "Trafik Adabı", question: "Trafik denetim görevlisine karşı nasıl bir tutum sergilenmelidir?", options: ["Agresif ve suçlayıcı", "Saygılı ve işbirliğine açık", "Umursamaz", "Alaycı"], correct: 1 },
    { id: 55, category: "Trafik Adabı", question: "Sürücünün trafik kurallarına uyması, öncelikle kime karşı sorumluluğudur?", options: ["Sadece polise", "Sadece ailesine", "Topluma ve kendisine", "Sadece aracına"], correct: 2 },
    { id: 56, category: "Trafik Adabı", question: "Engelli park yerlerine park etmemek, hangi trafik adabı değeriyle ilgilidir?", options: ["Tasarruf", "Duyarlılık ve hakka saygı", "Cesaret", "Rekabet"], correct: 1 },
    { id: 57, category: "Trafik Adabı", question: "Trafikte 'fermuar sistemi' ile yol vermek neyin göstergesidir?", options: ["Acemiliğin", "Saygı ve yardımlaşmanın", "Korkaklığın", "Kural tanımazlığın"], correct: 1 },
    { id: 58, category: "Trafik Adabı", question: "Yağmurlu havada yayalara su sıçratmamaya özen göstermek hangi davranışa örnektir?", options: ["Nezaket ve saygı", "Sorumsuzluk", "Dikkatsizlik", "Bencillik"], correct: 0 },
    { id: 59, category: "Trafik Adabı", question: "Trafikte kırmızı ışıkta beklerken sabırsızlanıp kornaya basmak neyin eksikliğidir?", options: ["Cesaretin", "Sabrın", "Hızın", "Dikkatin"], correct: 1 },
    { id: 60, category: "Trafik Adabı", question: "Hangi davranış trafik ortamında stresi azaltır?", options: ["Sürekli şerit değiştirmek", "Yüksek sesle müzik dinlemek", "Güleryüzlü ve sakin olmak", "Öndeki aracı sıkıştırmak"], correct: 2 },
    { id: 61, category: "Trafik Adabı", question: "Trafik kurallarının yasaklamadığı ancak toplum vicdanınca kabul görmeyen davranışlardan kaçınmak neyi ifade eder?", options: ["Trafik adabını", "Trafik suçunu", "Trafik cezasını", "Trafik terörünü"], correct: 0 },
    { id: 62, category: "Trafik Adabı", question: "Sürücünün hata yaptığında özür dilemesi veya teşekkür etmesi trafikte neyi sağlar?", options: ["Kaosu", "İletişimi ve yumuşamayı", "Kavgayı", "Trafiğin sıkışmasını"], correct: 1 },
    { id: 63, category: "Trafik Adabı", question: "Trafik ortamında, bazen hak kendinizden yana olsa bile bu hakkı diğer sürücüye vermek size ne kazandırır?", options: ["Zaman kaybı", "Maddi kayıp", "Saygınlık ve huzur", "İtibar kaybı"], correct: 2 },
    { id: 64, category: "Trafik Adabı", question: "Trafikte yaşanan öfke duygusu aşağıdakilerden hangisine yol açabilir?", options: ["Kural ihlallerinin azalmasına", "Dikkatin dağılmasına", "Trafik güvenliğinin artmasına", "Sürücülük yeteneğinin gelişmesine"], correct: 1 },
    { id: 65, category: "Trafik Adabı", question: "Aşağıdakilerden hangisi trafik adabına uymayan bir davranıştır?", options: ["Şerit değiştirirken sinyal vermek", "Hız sınırlarına uymak", "Emniyet şeridini gereksiz yere kullanmak", "Yayalar için durmak"], correct: 2 },
    { id: 66, category: "Trafik Adabı", question: "Trafikte diğer sürücülerin hatalarını tolere etmek hangi değerle açıklanır?", options: ["Hoşgörü", "Bencillik", "Kibir", "Sorumsuzluk"], correct: 0 },
    { id: 67, category: "Trafik Adabı", question: "Trafikte yardımlaşma neden önemlidir?", options: ["Trafiği yavaşlattığı için", "Kaza riskini azalttığı ve güvenliği artırdığı için", "Sürücülerin birbirini tanımasını sağladığı için", "Polis denetiminden kaçmak için"], correct: 1 },
    { id: 68, category: "Trafik Adabı", question: "Sürücünün trafik ortamında yaptığı hangi davranış, diğer sürücülerin dikkatinin dağılmasına ya da paniğe kapılmalarına sebep olabilir?", options: ["Sürekli şerit değiştirerek (slalom yaparak) araç kullanması", "Aracını kullanırken trafik kurallarının bilincinde olması", "Diğer sürücülere saygılı davranması", "Hız sınırlarına uyması"], correct: 0 },
    { id: 69, category: "Trafik Adabı", question: "Trafik içinde sorumluluk sahibi bir sürücüden aşağıdakilerden hangisi beklenmez?", options: ["Kendi hatasını kabul etmesi", "Bencilce davranışlarda bulunması", "Kurallara uyması", "Diğer sürücülere yardımcı olması"], correct: 1 },
    { id: 70, category: "Trafik Adabı", question: "Hangi davranış trafik adabına uygundur?", options: ["Bir yayaya yol vermek", "Kırmızı ışıkta geçmek", "Sürekli korna çalmak", "Emniyet şeridini ihlal etmek"], correct: 0 },
    { id: 71, category: "Trafik Adabı", question: "Trafikte 'Beden Dili'ni olumlu kullanmak neye yarar?", options: ["Kavgayı başlatmaya", "İletişimi güçlendirmeye ve yanlış anlaşılmaları önlemeye", "Diğer sürücüleri korkutmaya", "Trafiği tıkamaya"], correct: 1 },
    { id: 72, category: "Trafik Adabı", question: "Trafikte yüksek sesle müzik dinleyerek çevreyi rahatsız etmek hangi kural ihlaline girer?", options: ["Hız ihlali", "Park ihlali", "Gürültü kirliliği ve saygısızlık", "Şerit ihlali"], correct: 2 },
    { id: 73, category: "Trafik Adabı", question: "Trafikte araç kullanırken cep telefonu ile ilgilenmek neye sebep olur?", options: ["Dikkatin dağılmasına ve kaza riskinin artmasına", "Yakıt tasarrufuna", "Zaman kazanmaya", "Daha iyi araç kullanmaya"], correct: 0 },
    { id: 74, category: "Trafik Adabı", question: "Trafikte geçiş üstünlüğüne sahip araçlara yol vermek hangi değerin göstergesidir?", options: ["Korkaklığın", "Saygı ve sorumluluğun", "Acemiliğin", "Yavaşlığın"], correct: 1 },
    { id: 75, category: "Trafik Adabı", question: "Trafikte yayalara öncelik tanımak neden önemlidir?", options: ["Yayalar araçlardan daha hızlı olduğu için", "Yayalar savunmasız olduğu için ve medeniyet gereği", "Yayalar kuralları bilmediği için", "Araçların frenleri tutmadığı için"], correct: 1 },
    { id: 76, category: "Trafik Adabı", question: "Trafikte kırmızı ışıkta beklerken aracı stop ettirmek hangi değere örnektir?", options: ["Tasarruf ve çevre bilinci", "Cimrilik", "Tembellik", "Bilgisizlik"], correct: 0 },
    { id: 77, category: "Trafik Adabı", question: "Trafikte araç camından çöp atmak neyin göstergesidir?", options: ["Temizliğin", "Çevreye ve topluma saygısızlığın", "Zenginliğin", "Pratikliğin"], correct: 1 },
    { id: 78, category: "Trafik Adabı", question: "Trafikte takip mesafesine uymak hangi duygunun sonucudur?", options: ["Korku", "Güvenlik ve sorumluluk bilinci", "Acelecilik", "Öfke"], correct: 1 },
    { id: 79, category: "Trafik Adabı", question: "Trafikte sinyal vermeden şerit değiştirmek diğer sürücülerde neye neden olur?", options: ["Memnuniyete", "Şaşkınlık ve tehlikeye", "Rahatlamaya", "Güvene"], correct: 1 },
    { id: 80, category: "Trafik Adabı", question: "Trafikte bir kaza anında ilk yardım uygulamak hangi değerle ilişkilidir?", options: ["Yardımlaşma ve insan hayatına saygı", "Merak", "Gösteriş", "Zaman geçirme"], correct: 0 },
    { id: 81, category: "Trafik Adabı", question: "Trafikte alkollü araç kullanmak neyin ihlalidir?", options: ["Sadece kendi hayatının", "Sadece yasaların", "Hem yasaların hem de diğer insanların yaşam hakkının", "Sadece aracın güvenliğinin"], correct: 2 },
    { id: 82, category: "Trafik Adabı", question: "Trafikte emniyet kemeri takmak kime karşı sorumluluktur?", options: ["Sadece polise", "Sadece devlete", "Kendisine ve sevdiklerine", "Sadece sigorta şirketine"], correct: 2 },
    { id: 83, category: "Trafik Adabı", question: "Trafikte hız sınırlarına uymak neyi gösterir?", options: ["Aracın yavaş olduğunu", "Sürücünün acemi olduğunu", "Kurallara ve topluma saygıyı", "Yakıtın bittiğini"], correct: 2 },
    { id: 84, category: "Trafik Adabı", question: "Trafikte yorgun ve uykusuz araç kullanmamak hangi bilincin gereğidir?", options: ["Güvenlik bilinci", "Ekonomi bilinci", "Hız bilinci", "Yarış bilinci"], correct: 0 },
    { id: 85, category: "Trafik Adabı", question: "Trafikte gereksiz yere uzun farları yakmak karşıdaki sürücüyü nasıl etkiler?", options: ["Görüşünü artırır", "Gözünü kamaştırır ve kaza riski yaratır", "Memnun eder", "Uyarır"], correct: 1 },
    { id: 86, category: "Trafik Adabı", question: "Trafikte park halindeki bir araca çarpan sürücünün ne yapması gerekir?", options: ["Kaçması", "Görmezden gelmesi", "Sahibini bulması veya not bırakması", "Hasarı gizlemesi"], correct: 2 },
    { id: 87, category: "Trafik Adabı", question: "Trafikte okul taşıtlarına ve içindeki öğrencilere karşı nasıl davranılmalıdır?", options: ["Daha dikkatli ve hassas", "Umursamaz", "Agresif", "Sabırsız"], correct: 0 },
    { id: 88, category: "Trafik Adabı", question: "Trafikte bisiklet ve motosiklet sürücülerine karşı tutum nasıl olmalıdır?", options: ["Onları yok saymak", "Sıkıştırmak", "Haklarına saygı göstermek ve dikkat etmek", "Korna ile korkutmak"], correct: 2 },
    { id: 89, category: "Trafik Adabı", question: "Trafikte toplu taşıma araçlarına yol vermek neyin ifadesidir?", options: ["Topluma saygının", "Zayıflığın", "Korkunun", "Mecburiyetin"], correct: 0 },
    { id: 90, category: "Trafik Adabı", question: "Trafikte ambulansın siren sesini duyan sürücünün fermuar sistemi ile yol açması neyi gösterir?", options: ["Paniklediğini", "Trafik kültürüne sahip olduğunu", "Ceza yemekten korktuğunu", "Meraklı olduğunu"], correct: 1 },
    { id: 91, category: "Trafik Adabı", question: "Trafikte öfke kontrolü neden önemlidir?", options: ["Daha hızlı gitmek için", "Kavga etmek için", "Sağlıklı kararlar verebilmek ve güvenli sürüş için", "Bağırmak için"], correct: 2 },
    { id: 92, category: "Trafik Adabı", question: "Trafikte sabırlı olmak sürücüye ne kazandırır?", options: ["Stres ve kaza riskini azaltır", "Zaman kaybettirir", "Yorgunluk verir", "Öfkelendirir"], correct: 0 },
    { id: 93, category: "Trafik Adabı", question: "Trafikte hoşgörülü olmak ne demektir?", options: ["Her hatayı cezalandırmak", "Hataları görmezden gelmek değil, anlayışla karşılamak", "Kuralları ihlal etmek", "Umursamaz olmak"], correct: 1 },
    { id: 94, category: "Trafik Adabı", question: "Trafikte nezaket kurallarına uymak ortamı nasıl etkiler?", options: ["Gerginleştirir", "Yumuşatır ve güvenli hale getirir", "Karmaşıklaştırır", "Yavaşlatır"], correct: 1 },
    { id: 95, category: "Trafik Adabı", question: "Trafikte sorumluluk bilinci neyi gerektirir?", options: ["Sadece kendi aracını düşünmeyi", "Tüm yol kullanıcılarının güvenliğini düşünmeyi", "Hızlı gitmeyi", "Müzik dinlemeyi"], correct: 1 },
    { id: 96, category: "Trafik Adabı", question: "Trafikte iletişim sadece konuşarak mı olur?", options: ["Evet", "Hayır, sinyaller, korna ve beden dili de iletişimdir", "Hayır, sadece bakışarak olur", "İletişim yoktur"], correct: 1 },
    { id: 97, category: "Trafik Adabı", question: "Trafikte 'Ben merkezli' düşünmek neye yol açar?", options: ["Bencilliğe ve kural ihlallerine", "Saygıya", "Düzenli trafiğe", "Güvenliğe"], correct: 0 },
    { id: 98, category: "Trafik Adabı", question: "Trafikte kurallara uymak bir tercih midir?", options: ["Evet, isteyen uyar", "Hayır, yasal ve ahlaki bir zorunluluktur", "Bazen", "Sadece polis varken"], correct: 1 },
    { id: 99, category: "Trafik Adabı", question: "Trafikte iyi bir sürücü olmanın ölçütü nedir?", options: ["Çok hızlı gitmek", "Hiç kaza yapmamak ve kurallara saygılı olmak", "Pahalı araca binmek", "Yüksek sesle müzik dinlemek"], correct: 1 },
    { id: 100, category: "Trafik Adabı", question: "Trafik adabı, trafik kurallarının ötesinde neyi ifade eder?", options: ["Yazılı olmayan ahlaki değerleri ve davranışları", "Trafik cezalarını", "Yol yapım çalışmalarını", "Araç teknik özelliklerini"], correct: 0 },

    // --- MOTOR BİLGİSİ (101-150) ---
    { id: 101, category: "Motor Bilgisi", question: "Motorun soğutma sisteminde kullanılan antifriz, donmayı önlemenin yanı sıra hangisini de önler?", options: ["Yağ sızıntısını", "Buharlaşmayı", "Korozyon ve paslanmayı", "Yakıt tüketimini"], correct: 2 },
    { id: 102, category: "Motor Bilgisi", question: "Aracın gösterge panelinde bulunan 'Yağ Lambası' yandığında ne yapılmalıdır?", options: ["Yola devam edilmelidir", "Motor hemen durdurulmalıdır", "Hız artırılmalıdır", "Vites küçültülmelidir"], correct: 1 },
    { id: 103, category: "Motor Bilgisi", question: "Lastik hava basıncı normalden az ise ne olur?", options: ["Yakıt tüketimi artar", "Fren mesafesi kısalır", "Direksiyon hafifler", "Motor ısınır"], correct: 0 },
    { id: 104, category: "Motor Bilgisi", question: "Akü şarj ikaz ışığı yandığı halde araç sürülmeye devam edilirse ne olur?", options: ["Lastikler aşınır", "Akü boşalır", "Motor hararet yapar", "Frenler tutmaz"], correct: 1 },
    { id: 105, category: "Motor Bilgisi", question: "Dizel motorlu araçlarda yakıt filtresinin görevi nedir?", options: ["Yağı temizlemek", "Havayı temizlemek", "Suyu temizlemek", "Yakıtı temizlemek"], correct: 3 },
    { id: 106, category: "Motor Bilgisi", question: "Motor yağı kontrol edilirken yağ seviyesi yağ çubuğunun neresinde olmalıdır?", options: ["Alt çizginin altında", "Üst çizginin üzerinde", "İki çizgi arasında", "Hiç yağ olmamalıdır"], correct: 2 },
    { id: 107, category: "Motor Bilgisi", question: "Aracın gösterge panelinde 'Hararet Göstergesi' çalışmıyorsa sebebi ne olabilir?", options: ["Vantilatör kayışı gevşektir", "Radyatör suyu azdır", "Hararet müşürü arızalıdır", "Termostat arızalıdır"], correct: 2 },
    { id: 108, category: "Motor Bilgisi", question: "Seyir halindeyken araçtan yanık kablo kokusu gelirse ne yapılır?", options: ["Hız arttırılır", "Camlar açılır", "Durulur, kontak kapatılır ve akü bağlantısı kesilir", "Klimayı çalıştırılır"], correct: 2 },
    { id: 109, category: "Motor Bilgisi", question: "Akü başka bir aküyle takviye yapılacaksa kutup başları nasıl bağlanır?", options: ["(+) kutup (-) kutba", "(-) kutup (+) kutba", "(+) kutup (+) kutba, (-) kutup (-) kutba", "Rastgele bağlanır"], correct: 2 },
    { id: 110, category: "Motor Bilgisi", question: "Dizel motorlarda yakıtın ateşlenmesi nasıl olur?", options: ["Buji kıvılcımı ile", "Sıkıştırılan havanın sıcaklığı ile", "Manyeto ile", "Distribütör ile"], correct: 1 },
    { id: 111, category: "Motor Bilgisi", question: "Aracın egzoz dumanı siyah çıkıyorsa sebebi nedir?", options: ["Motor yağ yakıyordur", "Hava filtresi tıkalıdır", "Motor suyu eksilmiştir", "Yakıt kalitelidir"], correct: 1 },
    { id: 112, category: "Motor Bilgisi", question: "ABS fren sisteminin avantajı nedir?", options: ["Fren mesafesini uzatır", "Direksiyon hakimiyetini kaybettirir", "Frenleme sırasında direksiyon hakimiyetini korur", "Yakıt tasarrufu sağlar"], correct: 2 },
    { id: 113, category: "Motor Bilgisi", question: "Motorun soğutma suyuna kışın donmaması için ne konulur?", options: ["Saf su", "Asit", "Antifriz", "Motor yağı"], correct: 2 },
    { id: 114, category: "Motor Bilgisi", question: "Aracın elektrik devresini yüksek akıma karşı koruyan parça hangisidir?", options: ["Buji", "Alternatör", "Sigorta", "Karbüratör"], correct: 2 },
    { id: 115, category: "Motor Bilgisi", question: "Rodaj süresi dolan bir araçta hangi bakımın yapılması zorunludur?", options: ["Lastik değişimi", "Koltuk kılıfı değişimi", "Motor yağı ve yağ filtresi değişimi", "Akü değişimi"], correct: 2 },
    { id: 116, category: "Motor Bilgisi", question: "Benzinli motorlarda yakıtı ateşleyen parça hangisidir?", options: ["Enjektör", "Buji", "Kızdırma bujisi", "Karbüratör"], correct: 1 },
    { id: 117, category: "Motor Bilgisi", question: "Motorun çalışması için gerekli olan üç unsur nedir?", options: ["Yakıt, Hava, Ateşleme", "Su, Yağ, Benzin", "Elektrik, Su, Hava", "Mazot, Yağ, Su"], correct: 0 },
    { id: 118, category: "Motor Bilgisi", question: "Aracın lastikleri ne zaman kontrol edilmelidir?", options: ["Haftada bir", "Ayda bir", "Araca binileceği zaman", "Yılda bir"], correct: 2 },
    { id: 119, category: "Motor Bilgisi", question: "Motor yağı değiştirilirken aşağıdakilerden hangisi de değiştirilmelidir?", options: ["Hava filtresi", "Yağ filtresi", "Yakıt filtresi", "Polen filtresi"], correct: 1 },
    { id: 120, category: "Motor Bilgisi", question: "Aracın farlarından biri sönük yanıyorsa sebebi ne olabilir?", options: ["Akü boşalmıştır", "Kablo bağlantıları gevşemiştir", "Sigorta atmıştır", "Far anahtarı arızalıdır"], correct: 1 },
    { id: 121, category: "Motor Bilgisi", question: "Motor çalışırken marş yapılırsa ne olur?", options: ["Motor daha iyi çalışır", "Marş dişlisi zarar görür", "Akü şarj olur", "Farlar yanar"], correct: 1 },
    { id: 122, category: "Motor Bilgisi", question: "Radyatöre konulacak suyun seviyesi nerede olmalıdır?", options: ["Peteklerin üzerinde", "Peteklerin altında", "Ortasında", "Fark etmez"], correct: 0 },
    { id: 123, category: "Motor Bilgisi", question: "Fren pedalına basıldığında araç bir tarafa çekiyorsa sebebi nedir?", options: ["Fren ayarları bozuktur", "Lastik hava basınçları eşittir", "Motor yağı eksiktir", "Direksiyon kutusu arızalıdır"], correct: 0 },
    { id: 124, category: "Motor Bilgisi", question: "Egzozdan mavi duman çıkıyorsa motorun durumu nedir?", options: ["Zengin karışımla çalışıyordur", "Yağ yakıyordur", "Su kaynatıyordur", "Çiğ yakıt atıyordur"], correct: 1 },
    { id: 125, category: "Motor Bilgisi", question: "Aşağıdakilerden hangisi güç aktarma organıdır?", options: ["Motor", "Fren", "Diferansiyel", "Direksiyon"], correct: 2 },
    { id: 126, category: "Motor Bilgisi", question: "Vantilatör kayışı koparsa ne olur?", options: ["Motor hararet yapar", "Şarj lambası söner", "Motor stop eder", "Frenler tutmaz"], correct: 0 },
    { id: 127, category: "Motor Bilgisi", question: "Aracın kışa hazırlanması kapsamında hangisi kontrol edilir?", options: ["Klima gazı", "Antifriz", "Cam filmi", "Koltuk kılıfı"], correct: 1 },
    { id: 128, category: "Motor Bilgisi", question: "Hava filtresi kirli ise motor nasıl çalışır?", options: ["Zengin karışımla", "Fakir karışımla", "Normal", "Daha az yakıtla"], correct: 0 },
    { id: 129, category: "Motor Bilgisi", question: "Akü içerisindeki elektrolit seviyesi plakaların neresinde olmalıdır?", options: ["1 cm altında", "1 cm üzerinde", "Ortasında", "Hizasında"], correct: 1 },
    { id: 130, category: "Motor Bilgisi", question: "Motor hareketini tekerleklere ileten mil hangisidir?", options: ["Krank mili", "Eksantrik mili", "Aks mili", "Şaft"], correct: 2 },
    { id: 131, category: "Motor Bilgisi", question: "Debriyaj balatasının sıyrılarak aşınmasının sebebi nedir?", options: ["Aracın hızlı kullanılması", "Ani fren yapılması", "Ayağın debriyaj pedalında tutulması", "Lastiklerin eski olması"], correct: 2 },
    { id: 132, category: "Motor Bilgisi", question: "Aracın cam suyu haznesine kışın ne konulmalıdır?", options: ["Saf su", "Cam suyu antifrizi", "Motor yağı", "Tuzlu su"], correct: 1 },
    { id: 133, category: "Motor Bilgisi", question: "Dört zamanlı bir motorda iş (güç) hangi zamanda meydana gelir?", options: ["Emme", "Sıkıştırma", "Ateşleme (İş)", "Egzoz"], correct: 2 },
    { id: 134, category: "Motor Bilgisi", question: "Aracın direksiyonu zor dönüyorsa sebebi ne olabilir?", options: ["Lastik hava basınçları düşüktür", "Lastik hava basınçları yüksektir", "Motor yağı fazladır", "Yakıt azdır"], correct: 0 },
    { id: 135, category: "Motor Bilgisi", question: "Aşağıdakilerden hangisi yakıt tasarrufu sağlar?", options: ["Ani duruş ve kalkış yapmak", "Eskimiş bujileri değiştirmek", "Yüksek devirde araç kullanmak", "Camlar açık gitmek"], correct: 1 },
    { id: 136, category: "Motor Bilgisi", question: "Motorun silindirlerini oluşturan ana gövdeye ne ad verilir?", options: ["Karter", "Manifold", "Motor bloğu", "Silindir kapağı"], correct: 2 },
    { id: 137, category: "Motor Bilgisi", question: "Aracın süspansiyon sisteminde bulunan ve yay salınımını kontrol eden parça hangisidir?", options: ["Şaft", "Amortisör", "Rot", "Aks"], correct: 1 },
    { id: 138, category: "Motor Bilgisi", question: "Katalitik konvertörün görevi nedir?", options: ["Sesi azaltmak", "Egzoz gazındaki zararlı maddeleri azaltmak", "Yakıtı süzmek", "Motoru soğutmak"], correct: 1 },
    { id: 139, category: "Motor Bilgisi", question: "Aracın gösterge panelinde 'Akü' işareti yanıyorsa ne anlama gelir?", options: ["Akünün şarj olmadığını", "Akünün dolu olduğunu", "Farların açık olduğunu", "Motorun ısındığını"], correct: 0 },
    { id: 140, category: "Motor Bilgisi", question: "Motor soğutma suyu sıcaklığını sürücüye bildiren gösterge hangisidir?", options: ["Devir göstergesi", "Hız göstergesi", "Hararet göstergesi", "Yakıt göstergesi"], correct: 2 },
    { id: 141, category: "Motor Bilgisi", question: "Aşağıdakilerden hangisi motordaki yağın görevidir?", options: ["Motoru soğutmak", "Sürtünmeyi azaltmak ve aşınmayı önlemek", "Ateşlemeyi sağlamak", "Yakıtı temizlemek"], correct: 1 },
    { id: 142, category: "Motor Bilgisi", question: "El freni çekili iken araç hareket ettirilmeye çalışılırsa ne olur?", options: ["Motor stop eder", "Arka fren balataları ısınır ve yanar", "Araç daha hızlı gider", "Vites geçmez"], correct: 1 },
    { id: 143, category: "Motor Bilgisi", question: "Aracın periyodik bakımı yapılmazsa ne olur?", options: ["Yakıt sarfiyatı artar", "Araç daha performanslı çalışır", "Lastik ömrü uzar", "Frenler daha iyi tutar"], correct: 0 },
    { id: 144, category: "Motor Bilgisi", question: "Dizel motorlarda 'Kızdırma Bujisi' ne işe yarar?", options: ["Yakıtı ateşler", "Silindir içindeki havayı ısıtır", "Egzoz gazını süzer", "Yağı ısıtır"], correct: 1 },
    { id: 145, category: "Motor Bilgisi", question: "Aracın lastiklerinde balanssızlık varsa ne olur?", options: ["Direksiyonda titreşimler olur", "Frenler tutmaz", "Motor hararet yapar", "Şarj lambası yanar"], correct: 0 },
    { id: 146, category: "Motor Bilgisi", question: "Aşağıdakilerden hangisi araçta sigortanın görevidir?", options: ["Aküyü şarj etmek", "Kısa devre olduğunda sistemi korumak", "Bujilere akım göndermek", "Yakıtı ateşlemek"], correct: 1 },
    { id: 147, category: "Motor Bilgisi", question: "Motor çalışırken yağ lambasının yanmasının sebebi ne olabilir?", options: ["Yağ pompasının arızalanması", "Benzinin bitmesi", "Suyun eksilmesi", "Akünün bitmesi"], correct: 0 },
    { id: 148, category: "Motor Bilgisi", question: "Aracın egzoz susturucusu çıkarılırsa ne olur?", options: ["Gürültü kirliliği artar", "Yakıt tasarrufu sağlanır", "Motor ömrü uzar", "Araç daha sessiz çalışır"], correct: 0 },
    { id: 149, category: "Motor Bilgisi", question: "Aşağıdakilerden hangisi şasi ve karoserin birleşimi ile oluşan araç yapısıdır?", options: ["Motor", "Gövde", "Tekerlek", "Direksiyon"], correct: 1 },
    { id: 150, category: "Motor Bilgisi", question: "Aracın ilk çalıştırılması sırasında marş süresi ne kadar olmalıdır?", options: ["10-15 saniye", "1-2 dakika", "30-40 saniye", "5-10 dakika"], correct: 0 },

    // --- İLK YARDIM (151-200) ---
    { id: 151, category: "İlk Yardım", question: "Hayat kurtarma zincirinin ilk halkası nedir?", options: ["Ambulans çağırmak", "Olay yerinde ilk yardım yapmak", "Sağlık kuruluşuna haber vermek (112)", "Hastane acil servisi"], correct: 2 },
    { id: 152, category: "İlk Yardım", question: "Solunum yolu tam tıkanmış bir kazazedeye hangi manevra uygulanır?", options: ["Rentek manevrası", "Heimlich manevrası", "İtfaiyeci yöntemi", "Altın beşik yöntemi"], correct: 1 },
    { id: 153, category: "İlk Yardım", question: "Turnike uygulaması hangi durumda yapılır?", options: ["Kırıklarda", "Hafif sıyrıklarda", "Uzuv kopması ve durdurulamayan kanamalarda", "Yanıklarda"], correct: 2 },
    { id: 154, category: "İlk Yardım", question: "Kazazedenin burnundan kan geliyorsa ne yapılmalıdır?", options: ["Başı geriye itilir", "Sırt üstü yatırılır", "Başı hafifçe öne eğilir ve burun kanatları sıkıştırılır", "Burun delikleri pamukla tıkanır"], correct: 2 },
    { id: 155, category: "İlk Yardım", question: "Bebeklerde kalp masajı nereye ve nasıl yapılır?", options: ["Göğüs kemiğinin altına, avuç içiyle", "Göğüs kemiğinin ortasına, iki parmakla", "Sırtına, yumrukla", "Karnına, tek elle"], correct: 1 },
    { id: 156, category: "İlk Yardım", question: "Şok pozisyonunda kazazedenin ayakları ne kadar yukarı kaldırılır?", options: ["10 cm", "30 cm", "50 cm", "70 cm"], correct: 1 },
    { id: 157, category: "İlk Yardım", question: "Yanık vakalarında uygulanan en doğru ilk yardım nedir?", options: ["Yanık bölgeye diş macunu sürmek", "Yanık bölgeyi en az 20 dakika çeşme suyu altında tutmak", "Buz uygulamak", "Yoğurt sürmek"], correct: 1 },
    { id: 158, category: "İlk Yardım", question: "Kaza geçirmiş yaralı bir kişiyi araçtan çıkarırken hangi manevra kullanılır?", options: ["Heimlich manevrası", "Rentek manevrası", "Kaşık tekniği", "Köprü tekniği"], correct: 1 },
    { id: 159, category: "İlk Yardım", question: "Aşağıdakilerden hangisi kırık belirtisidir?", options: ["Hareket ile artan ağrı ve şekil bozukluğu", "Yüksek ateş", "Baş dönmesi", "Mide bulantısı"], correct: 0 },
    { id: 160, category: "İlk Yardım", question: "Bilinci kapalı, solunumu olan kazazedeye hangi pozisyon verilir?", options: ["Şok pozisyonu", "Yarı oturuş pozisyonu", "Koma (Yan yatış) pozisyonu", "Sırt üstü yatış"], correct: 2 },
    { id: 161, category: "İlk Yardım", question: "112 Acil Yardım hattı arandığında verilmesi gereken en öncelikli bilgi nedir?", options: ["Yaralıların adları", "Adres (Olay yeri)", "Hava durumu", "Araç plakaları"], correct: 1 },
    { id: 162, category: "İlk Yardım", question: "Dış kanamalarda kanayan bölgeye yapılacak ilk işlem nedir?", options: ["Turnike uygulamak", "Sıcak uygulama yapmak", "Temiz bir bezle baskı uygulamak", "Merhem sürmek"], correct: 2 },
    { id: 163, category: "İlk Yardım", question: "İlk yardımın ABC'sinde 'A' neyi ifade eder?", options: ["Hava yolu açıklığının değerlendirilmesi", "Solunumun değerlendirilmesi", "Dolaşımın değerlendirilmesi", "Kanamanın durdurulması"], correct: 0 },
    { id: 164, category: "İlk Yardım", question: "Yetişkinlerde kalp masajı basısı göğüs kemiğini kaç cm aşağı indirmelidir?", options: ["2 cm", "5 cm", "10 cm", "15 cm"], correct: 1 },
    { id: 165, category: "İlk Yardım", question: "Aşağıdakilerden hangisi şok belirtisidir?", options: ["Ciltte kızarıklık", "Nabzın yavaş ve güçlü olması", "Cildin soğuk ve nemli olması", "Tansiyonun yükselmesi"], correct: 2 },
    { id: 166, category: "İlk Yardım", question: "Koma halindeki kazazedeye aşağıdakilerden hangisi yapılmaz?", options: ["Solunum yolu açık tutulur", "Yan yatış pozisyonu verilir", "Ağızdan yiyecek içecek verilir", "Sıkan giysileri gevşetilir"], correct: 2 },
    { id: 167, category: "İlk Yardım", question: "Delici göğüs yaralanmalarında kazazedeye hangi pozisyon verilir?", options: ["Yarı oturur pozisyon", "Sırt üstü yatış", "Yüz üstü yatış", "Şok pozisyonu"], correct: 0 },
    { id: 168, category: "İlk Yardım", question: "Aşağıdakilerden hangisi burkulmalarda yapılan ilk yardım uygulamalarındandır?", options: ["Sıcak uygulama yapmak", "Burkulan bölgeyi hareket ettirmek", "Burkulan bölgeyi yukarı kaldırmak ve soğuk uygulama yapmak", "Masaj yapmak"], correct: 2 },
    { id: 169, category: "İlk Yardım", question: "Göze toz kaçması halinde ne yapılmalıdır?", options: ["Göz ovuşturulmalıdır", "Bol temiz su ile yıkanmalıdır", "Göze merhem sürülmelidir", "Göz kapatılıp beklenmelidir"], correct: 1 },
    { id: 170, category: "İlk Yardım", question: "Sara krizi geçiren birine nasıl müdahale edilir?", options: ["Kilitlenen çenesi zorla açılır", "Soğan koklatılır", "Krizin geçmesi beklenir, güvenlik önlemleri alınır", "Su içirilir"], correct: 2 },
    { id: 171, category: "İlk Yardım", question: "Aşağıdakilerden hangisi zehirlenme belirtisidir?", options: ["İştah artması", "Bulantı, kusma, karın ağrısı", "Neşeli olma hali", "Göz bebeklerinin büyümesi"], correct: 1 },
    { id: 172, category: "İlk Yardım", question: "Arı sokmasında ilk yardım olarak ne yapılır?", options: ["Sokulan yer emilir", "Sıcak su dökülür", "Arının iğnesi görünüyorsa çıkarılır, soğuk uygulama yapılır", "Çamur sürülür"], correct: 2 },
    { id: 173, category: "İlk Yardım", question: "Aşağıdakilerden hangisi sıcak çarpması belirtisidir?", options: ["Titreme", "Soğuk cilt", "Aşırı terleme, baş dönmesi, bitkinlik", "Yavaş nabız"], correct: 2 },
    { id: 174, category: "İlk Yardım", question: "Kaza yerinde olay yeri güvenliğini sağlamanın amacı nedir?", options: ["Meraklıları uzaklaştırmak", "Yeni kazaların olmasını önlemek", "Polise yardımcı olmak", "Trafiği açmak"], correct: 1 },
    { id: 175, category: "İlk Yardım", question: "Hangi durumda suni solunum yapılır?", options: ["Kalbi durduğunda", "Solunumu durduğunda", "Bilinci kapandığında", "Kanaması olduğunda"], correct: 1 },
    { id: 176, category: "İlk Yardım", question: "Aşağıdakilerden hangisi atardamar kanamasının özelliğidir?", options: ["Sızıntı şeklinde olması", "Koyu renkli olması", "Kalp atımları ile uyumlu fışkırır tarzda ve açık renkli olması", "Yavaş akması"], correct: 2 },
    { id: 177, category: "İlk Yardım", question: "Omurga kırığı şüphesi olan kazazede nasıl taşınmalıdır?", options: ["Kucakta", "Sırtta", "Sedyeye bağlanarak, hareket ettirilmeden", "Yürütülerek"], correct: 2 },
    { id: 178, category: "İlk Yardım", question: "Aşağıdakilerden hangisi ilk yardımcının özelliklerinden olmalıdır?", options: ["Panik olması", "Sakin, kararlı ve pratik olması", "Tıbbi eğitiminin olması", "Çok güçlü olması"], correct: 1 },
    { id: 179, category: "İlk Yardım", question: "Bak-Dinle-Hisset yöntemi neyi değerlendirmek için kullanılır?", options: ["Kırığı", "Kanamayı", "Solunumu", "Bilinci"], correct: 2 },
    { id: 180, category: "İlk Yardım", question: "Aşağıdakilerden hangisi delici karın yaralanmalarında yapılan ilk yardımdır?", options: ["Dışarı çıkan organlar içeri sokulur", "Dışarı çıkan organların üzeri nemli temiz bir bezle örtülür", "Kazazede yüz üstü yatırılır", "Bol su içirilir"], correct: 1 },
    { id: 181, category: "İlk Yardım", question: "Kısa mesafede süratli taşıma tekniklerinden 'İtfaiyeci Yöntemi' kimler için uygundur?", options: ["Yürüyebilenler için", "Bilinci açık olanlar için", "Yürüyemeyen veya bilinci kapalı olanlar için", "Çocuklar için"], correct: 2 },
    { id: 182, category: "İlk Yardım", question: "Aşağıdakilerden hangisi bilinç bozukluğu durumlarından biridir?", options: ["Baş ağrısı", "Bayılma", "Öksürük", "Hapşırma"], correct: 1 },
    { id: 183, category: "İlk Yardım", question: "Donma vakalarında ilk yardım nasıl olmalıdır?", options: ["Donan bölge ovulur", "Sıcak suya sokulur", "Kendiliğinden ısınması sağlanır veya ılık ortamda ısıtılır", "Karla ovulur"], correct: 2 },
    { id: 184, category: "İlk Yardım", question: "Köprücük kemiği kırıklarında hangi sargı tekniği kullanılır?", options: ["Üçgen sargı", "Sekiz sargı", "Spiral sargı", "Dairesel sargı"], correct: 1 },
    { id: 185, category: "İlk Yardım", question: "Aşağıdakilerden hangisi sindirim yoluyla zehirlenmelerde yapılan ilk yardımdır?", options: ["Kusturulur", "Bol su içirilir (yakıcı madde değilse)", "Uyutulur", "Sırt üstü yatırılır"], correct: 1 },
    { id: 186, category: "İlk Yardım", question: "Göğüs ağrısı olan hastaya hangi pozisyon verilir?", options: ["Yarı oturur", "Sırt üstü", "Yüz üstü", "Şok"], correct: 0 },
    { id: 187, category: "İlk Yardım", question: "Aşağıdakilerden hangisi dolaşım sistemini oluşturan yapılardandır?", options: ["Akciğerler", "Mide", "Kalp, kan damarları ve kan", "Böbrekler"], correct: 2 },
    { id: 188, category: "İlk Yardım", question: "Yetişkin bir insanda dakikadaki normal nabız sayısı kaçtır?", options: ["40-50", "60-100", "110-130", "140-160"], correct: 1 },
    { id: 189, category: "İlk Yardım", question: "Aşağıdakilerden hangisi solunum durmasının belirtisidir?", options: ["Göğüs hareketlerinin kaybolması", "Yüzün kızarması", "Nabzın hızlanması", "Göz bebeklerinin küçülmesi"], correct: 0 },
    { id: 190, category: "İlk Yardım", question: "Aşağıdakilerden hangisi kafa travması belirtisidir?", options: ["Kulaktan veya burundan kan/sıvı gelmesi", "Karın ağrısı", "Ayak ağrısı", "Öksürük"], correct: 0 },
    { id: 191, category: "İlk Yardım", question: "Aşağıdakilerden hangisi ilk yardımın temel uygulamalarından (KBK) biridir?", options: ["Kaçmak", "Korumak", "Korkmak", "Karışmamak"], correct: 1 },
    { id: 192, category: "İlk Yardım", question: "Hangi durumda kazazede araçtan çıkarılmaz?", options: ["Yangın tehlikesi varsa", "Patlama tehlikesi varsa", "Solunumu durmuşsa", "Hayati tehlikesi yoksa ve güvenli bir yerdeyse"], correct: 3 },
    { id: 193, category: "İlk Yardım", question: "Aşağıdakilerden hangisi vücut ısısının düşmesi (hipotermi) belirtisidir?", options: ["Titreme, uyuşukluk, konuşma bozukluğu", "Aşırı terleme", "Hızlı nabız", "Yüz kızarması"], correct: 0 },
    { id: 194, category: "İlk Yardım", question: "Aşağıdakilerden hangisi göze yabancı cisim batması durumunda yapılır?", options: ["Cisim çıkarılmaya çalışılır", "İki göz de kapatılarak hastaneye sevk edilir", "Göz ovuşturulur", "Göz açık tutulur"], correct: 1 },
    { id: 195, category: "İlk Yardım", question: "Aşağıdakilerden hangisi kan şekeri düşüklüğü belirtisidir?", options: ["Açlık hissi, titreme, terleme", "Aşırı susama", "Sık idrara çıkma", "Ağız kokusu"], correct: 0 },
    { id: 196, category: "İlk Yardım", question: "Aşağıdakilerden hangisi tetanoz riski taşıyan yaralardandır?", options: ["Sıyrıklar", "Paslı metal yaralanmaları, toprakla kirlenmiş yaralar", "Temiz bıçak kesikleri", "Çizikler"], correct: 1 },
    { id: 197, category: "İlk Yardım", question: "Aşağıdakilerden hangisi ilk yardım çantasında bulunması zorunlu malzemelerdendir?", options: ["Ağrı kesici ilaç", "Yara bandı, sargı bezi, üçgen sargı", "Tırnak makası", "Dikiş iğnesi"], correct: 1 },
    { id: 198, category: "İlk Yardım", question: "Aşağıdakilerden hangisi kalp krizinin belirtisidir?", options: ["Göğüste baskı hissi, sol kola yayılan ağrı", "Karın ağrısı", "Baş dönmesi", "Bacak ağrısı"], correct: 0 },
    { id: 199, category: "İlk Yardım", question: "Aşağıdakilerden hangisi boğulmalarda genel ilk yardım kuralıdır?", options: ["Su yutturulur", "Sırtına vurulur", "Sudan çıkarılır, ABC değerlendirilir, gerekiyorsa temel yaşam desteği sağlanır", "Ayaklarından asılır"], correct: 2 },
    { id: 200, category: "İlk Yardım", question: "Aşağıdakilerden hangisi organ bağışı ile ilgili doğru bir bilgidir?", options: ["Sadece yaşlılar organ bağışlayabilir", "18 yaşını doldurmuş ve akli dengesi yerinde olan herkes organ bağışlayabilir", "Organ bağışı dinen yasaktır", "Sadece akrabalara organ bağışlanabilir"], correct: 1 }
];

function fetchMockQuestions() {
    return new Promise(resolve => {
        // Optimizasyon: Gecikme süresi düşürüldü (300ms -> 10ms)
        setTimeout(() => {
            resolve(MOCK_DATA);
        }, 10);
    });
}

// 19. İnternet Bağlantısı Kontrolü
function updateOnlineStatus() {
    const warning = document.getElementById('offline-warning');
    if (!navigator.onLine) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// 22. Buton Tıklama Sesi Efekti
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (!soundEnabled) return;

    // Tarayıcı politikaları gereği context askıdaysa başlat
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Daha kısa, net ve modern bir "pop" sesi
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
}

document.addEventListener('click', (e) => {
    // Tıklanan element veya ebeveyni bir buton ise sesi çal
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        playClickSound();
    }
});

// 24. Sonuç Ses Efektleri (Başarı/Başarısızlık)
function playResultSound(isSuccess) {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    if (isSuccess) {
        // Başarı Sesi: Yükselen Majör Arpej (Ta-da!)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    } else {
        // Başarısızlık Sesi: Alçalan tonlar (Wah-wah-wah)
        const notes = [392.00, 369.99, 349.23, 329.63]; // G4, F#4, F4, E4
        
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sawtooth'; // Biraz daha sert ton
            osc.frequency.setValueAtTime(freq, now + i * 0.3);
            // Hafif kayma efekti (pitch bend)
            osc.frequency.linearRampToValueAtTime(freq - 10, now + i * 0.3 + 0.25);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            gain.gain.setValueAtTime(0.05, now + i * 0.3);
            gain.gain.linearRampToValueAtTime(0.001, now + i * 0.3 + 0.25);
            
            osc.start(now + i * 0.3);
            osc.stop(now + i * 0.3 + 0.25);
        });
    }
}