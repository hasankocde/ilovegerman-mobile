# iOS Native App Build Rehberi

**Bu dosya Mac'iniz olduğunda kullanmanız için hazırlandı.**

## Mevcut Durum

- ✅ GitHub repo hazır: https://github.com/hasankocde/ilovegerman-mobile
- ✅ iOS Simulator build GitHub Actions'ta çalışıyor
- ✅ PWA olarak deploy edildi: https://hasankocde.github.io/ilovegerman-mobile/
- ⏸️ Native iOS app için Mac gerekli

---

## Mac'te Yapılacaklar (Adım Adım)

### 1. Xcode Kurulumu
```bash
# App Store'dan Xcode'u indir (ücretsiz, ~12GB)
# Veya: xcode-select --install
```

### 2. Projeyi Klonla
```bash
git clone https://github.com/hasankocde/ilovegerman-mobile.git
cd ilovegerman-mobile
```

### 3. Bağımlılıkları Kur
```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
cd ios/App
pod install
```

### 4. Xcode'da Aç
```bash
open ios/App/App.xcworkspace
```

### 5. iPhone'a Yükle (Ücretsiz - 7 Günlük)
1. iPhone'u USB ile Mac'e bağla
2. Xcode'da sol üstten iPhone'u seç
3. Xcode > Preferences > Accounts > Apple ID ekle
4. Signing > Team olarak Apple ID'ni seç
5. ▶️ (Play) butonuna bas

**Not:** Ücretsiz Apple ID ile 7 günde bir yeniden yüklemeniz gerekir.

### 6. Kalıcı Yükleme (Opsiyonel - $99/yıl)
Apple Developer Program'a üye olursanız:
- Sınırsız süre çalışır
- TestFlight ile başkalarına dağıtabilirsiniz
- App Store'a yükleyebilirsiniz

---

## Önemli Dosyalar

| Dosya | Konum |
|-------|-------|
| iOS Workflow | `.github/workflows/ios-build.yml` |
| Capacitor Config | `capacitor.config.ts` |
| PWA Manifest | `src/manifest.json` |

---

## Gemini ile Devam Etmek

Mac'iniz olduğunda yeni bir sohbet açın ve şunu söyleyin:

> "GitHub'daki hasankocde/ilovegerman-mobile projesini Mac'te build edip iPhone'a yüklemek istiyorum. Adım adım yardım et."

---

**Tarih:** 2025-12-06
