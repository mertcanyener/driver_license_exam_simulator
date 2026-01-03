// Sınav Ayarları
let currentQuestionIndex = 0;
let timeLeft = 45 * 60; // 45 dakika (saniye cinsinden)
let timerInterval;
let userAnswers = new Array(50).fill(null); // 50 soruluk boş cevap dizisi

// Örnek Soru Yapısı (Gerçekte bu liste 50 tane olacak)
const questions = [
    {
        id: 1,
        question: "Şekildeki trafik işareti neyi bildirir?",
        options: ["Yol ver", "Dur", "Girişi olmayan yol", "Hız sınırlaması"],
        correct: 0 // A şıkkı
    },
    {
        id: 2,
        question: "Aşağıdakilerden hangisi ilk yardımın temel ilkelerinden biridir?",
        options: ["İlaçla tedavi etmek", "Ameliyat yapmak", "Haberleşmeyi kesmek", "Koruma, Bildirme, Kurtarma"],
        correct: 3 // D şıkkı
    }
    // ... Diğer sorular buraya eklenebilir
];

// Sınavı Başlat
function startExam() {
    startTimer();
    createNavigationGrid();
    showQuestion(0);
}

// Geri Sayım Sayacı
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        document.getElementById('time-left').innerText = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            finishExam();
        }
    }, 1000);
}

// Soru Navigasyon Panelini Oluştur (1-50)
function createNavigationGrid() {
    const grid = document.getElementById('question-navigation');
    for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        dot.classList.add('nav-dot');
        dot.innerText = i + 1;
        dot.onclick = () => showQuestion(i);
        grid.appendChild(dot);
    }
}

// Soruyu Ekrana Getir
function showQuestion(index) {
    currentQuestionIndex = index;
    document.getElementById('question-number').innerText = `Soru: ${index + 1} / 50`;
    
    // Eğer soru verisi varsa göster (Şimdilik örnek verilerle sınırlı)
    const q = questions[index] || { question: "Soru verisi henüz eklenmedi.", options: ["-","-","-","-"] };
    document.getElementById('question-text').innerText = q.question;
}

// Sınavı Bitir ve Sonuçları Hesapla
function finishExam() {
    clearInterval(timerInterval);
    
    // Geçen Süreyi Hesapla
    const spentTimeSeconds = (45 * 60) - timeLeft;
    const spentMinutes = Math.floor(spentTimeSeconds / 60);
    const spentSeconds = spentTimeSeconds % 60;

    // Örnek Hesaplama (Geliştirilecek)
    let corrects = 0;
    let wrongs = 0;
    
    // Sonuç Ekranını Göster
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('correct-count').innerText = corrects;
    document.getElementById('wrong-count').innerText = wrongs;
    document.getElementById('time-spent').innerText = `${spentMinutes}:${spentSeconds.toString().padStart(2, '0')}`;
}

// Uygulamayı Başlat
window.onload = startExam;