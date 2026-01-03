// 1. Değişken Tanımlamaları
let questions = []; // JSON'dan gelecek sorular buraya dolacak
let currentQuestionIndex = 0;
let timeLeft = 45 * 60; // 45 dakika (saniye cinsinden)
let timerInterval;
let userAnswers = new Array(50).fill(null); // Kullanıcının cevaplarını tutacak (A, B, C, D veya null)

// 2. Sınavı Başlatan Fonksiyon (JSON Verisini Çeker)
async function startExam() {
    try {
        // questions.json dosyasından verileri oku
        const response = await fetch('questions.json');
        questions = await response.json();
        
        // Veriler başarıyla geldiyse arayüzü hazırla
        createNavigationGrid();
        showQuestion(0);
        startTimer();
    } catch (error) {
        console.error("Sorular yüklenirken hata oluştu:", error);
        alert("Soru veritabanı yüklenemedi! Lütfen Live Server'ın açık olduğundan emin olun.");
    }
}

// 3. Soruyu Ekrana Basan Fonksiyon
function showQuestion(index) {
    currentQuestionIndex = index;
    
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
            if (userAnswers[index] === i) button.classList.add('selected'); // İşaretlenmişse vurgula
            
            button.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${option}</span>
            `;
            button.onclick = () => selectOption(index, i);
            optionsContainer.appendChild(button);
        });
    }
    
    updateNavigationStatus();
}

// 4. Şık Seçme Fonksiyonu
function selectOption(qIndex, optionIndex) {
    userAnswers[qIndex] = optionIndex; // Cevabı kaydet
    showQuestion(qIndex); // Ekranı güncelle (seçili hali göstermek için)
}

// 5. Yan Menü (1-50) Navigasyon Paneli
function createNavigationGrid() {
    const grid = document.getElementById('question-navigation');
    grid.innerHTML = '';
    for (let i = 0; i < 50; i++) {
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
            if (answer !== null) dot.classList.add('answered'); // Cevaplandıysa renk değiştir
            if (i === currentQuestionIndex) dot.classList.add('active'); // Şu anki soruyu vurgula
            else dot.classList.remove('active');
        }
    });
}

// 7. Zamanlayıcı
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        document.getElementById('time-left').innerText = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) finishExam();
    }, 1000);
}

// 8. Sınavı Bitir ve Sonuçları Hesapla
function finishExam() {
    clearInterval(timerInterval);
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
    
    const timeSpent = (45 * 60) - timeLeft;
    const m = Math.floor(timeSpent / 60);
    const s = timeSpent % 60;
    document.getElementById('time-spent').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    document.getElementById('result-screen').classList.remove('hidden');
}

// Butonlara olay dinleyicileri ekle
document.getElementById('next-btn').onclick = () => { if(currentQuestionIndex < 49) showQuestion(currentQuestionIndex + 1); };
document.getElementById('prev-btn').onclick = () => { if(currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1); };
document.getElementById('finish-exam-btn').onclick = () => { if(confirm("Sınavı bitirmek istediğinize emin misiniz?")) finishExam(); };

// Sayfa yüklendiğinde sınavı başlat
window.onload = startExam;