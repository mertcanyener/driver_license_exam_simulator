# Ehliyet Sınavı Simülasyonu

Bu proje, ehliyet sınavına hazırlananlar için geliştirilmiş, Duolingo tarzı arayüze sahip interaktif bir web uygulamasıdır.

## Özellikler
- **Geniş Soru Havuzu:** MEB müfredatına uygun 200+ soru.
- **Oyunlaştırılmış Arayüz:** İlerleme çubukları, seviye sistemi ve başarı ödülleri.
- **Kaldığım Yerden Devam Et:** Tarayıcı hafızası sayesinde sınavı yarıda bırakıp devam edebilme.
- **Ses Efektleri:** Etkileşimli buton ve sonuç sesleri.
- **Mobil Uyumlu:** Tüm cihazlarda sorunsuz çalışan responsive tasarım.
- **Gizlilik:** Kişisel veri toplamayan güvenli yapı. Detaylar için [PRIVACY_POLICY.md](PRIVACY_POLICY.md) dosyasına bakabilirsiniz.
- **Reklamlar:** Google AdMob entegrasyonu (Banner ve Interstitial).

## Kurulum
Projeyi indirdikten sonra `index.html` dosyasını tarayıcınızda açmanız yeterlidir.

### AdMob Kurulumu (Mobil Uygulama İçin)
Reklamların çalışması için terminalde şu komutu çalıştırarak eklentiyi yükleyin:
```bash
npm install @capacitor-community/admob
npx cap sync
```