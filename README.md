# Nefes

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Nefes, kullanıcının bulunduğu konumdaki hava kalitesini (AQI - Air Quality Index) anlık olarak izlemeye, harita üzerinde hava kalitesi istasyonlarını görselleştirmeye ve sağlık önerileri sunmaya odaklanmış modern bir web uygulamasıdır.

## Proje Amacı

Bu uygulama, karmaşık hava kalitesi verilerini sade ve anlaşılır bir arayüzle sunarak kullanıcıların günlük yaşamlarında bilinçli kararlar alabilmelerini amaçlar. Gerçek zamanlı veriler, interaktif haritalar ve kişiselleştirilmiş sağlık önerileri ile hava kalitesi takibini herkes için erişilebilir kılar.

## Temel Özellikler

### Konum ve Harita
- Tarayıcı geolocation API'si ile anlık konum tespiti
- Maptiler tabanlı interaktif harita görselleştirmesi
- Hava kalitesi istasyonlarının AQI seviyelerine göre renklendirilmiş işaretlenmesi
- Navigasyon ve zoom kontrolleri

### Veri Görselleştirmesi
- Anlık hava kalitesi (AQI) değerlerinin görüntülenmesi
- PM2.5, PM10, Ozon, SO2, NO2 gibi detaylı kirletici verilerinin sunumu
- Geçmiş 24 saatlik ve 7 günlük veri trendlerinin grafik halinde görselleştirmesi
- Responsive tasarım ile tüm cihazlarda uyumlu görüntüleme

### Kullanıcı Deneyimi
- Şehir ve adres bazlı arama fonksiyonu
- AQI seviyelerine göre dinamik sağlık önerileri
- Progressive loading ve skeleton UI ile hızlı yükleme deneyimi
- Konum izin yönetimi ve kullanıcı bilgilendirmesi

## Teknik Mimari

### Frontend Framework
- **Next.js 15.5.0** - App Router mimarisi ile SSR ve Client Components
- **TypeScript 5** - Tip güvenliği ve geliştirilmiş geliştirici deneyimi
- **React 19.1.0** - Modern React özellikleri ve hooks

### Harita ve Görselleştirme
- **MapLibre GL JS 5.6.2** - Performanslı ve açık kaynaklı harita render motoru
- **React Map GL 8.0.4** - React entegrasyonu için harita wrapper
- **Maptiler API** - Harita servisi ve stil sağlayıcısı

### UI/UX Kütüphaneleri
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - New York tarzı, erişilebilir UI bileşen sistemi
- **Radix UI Primitives** - Erişilebilir ve özelleştirilebilir temel bileşenler
  - @radix-ui/react-dialog 1.1.15
  - @radix-ui/react-slot 1.2.3
- **Lucide React 0.541.0** - Modern SVG ikon kütüphanesi
- **Vaul 1.1.2** - Mobile-first drawer bileşeni
- **Geist 1.4.2** - Vercel tarafından tasarlanan modern font ailesi

### Yardımcı Kütüphaneler
- **class-variance-authority** - Tip güvenli CSS varyant yöneticisi
- **clsx & tailwind-merge** - Dinamik CSS sınıf yönetimi
- **tw-animate-css** - Tailwind için ek animasyon utilities

### Custom Hooks
- **useGeolocation** - Tarayıcı geolocation API'si wrapper
- **useLocationPermission** - Konum izin durumu yöneticisi
- **useMediaQuery** - Responsive breakpoint hook

### Geliştirme Araçları
- **ESLint 9** - Kod kalitesi ve stil kontrolü
- **Turbopack** - Hızlı geliştirme ve build süreçleri
- **PostCSS** - CSS işleme ve optimizasyon

### Veri Kaynağı
- **OpenAQ Platform API** - Küresel hava kalitesi veri sağlayıcısı
- **Next.js API Routes** - Backend katmanı ve API proxy

## Proje Yapısı

```
nefes/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global stil tanımlamaları
│   │   ├── layout.tsx           # Ana layout ve metadata
│   │   └── page.tsx             # Ana sayfa bileşeni
│   ├── components/
│   │   ├── ui/                  # shadcn/ui temel bileşenleri
│   │   ├── Map.tsx              # MapLibre harita bileşeni
│   │   └── LocationPermissionDialog.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Konum API hook
│   │   ├── useLocationPermission.ts
│   │   └── useMediaQuery.ts     # Responsive hook
│   └── lib/
│       └── utils.ts             # Yardımcı fonksiyonlar
├── components.json              # shadcn/ui konfigürasyonu
├── tsconfig.json               # TypeScript konfigürasyonu
├── next.config.ts              # Next.js konfigürasyonu
├── eslint.config.mjs           # ESLint konfigürasyonu
├── postcss.config.mjs          # PostCSS konfigürasyonu
└── package.json                # Proje bağımlılıkları
```

## Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 20+
- Maptiler API anahtarı
- OpenAQ API anahtarı (opsiyonel)

### Adımlar

1. Proje deposunu klonlayın:
```bash
git clone https://github.com/umutcandev/nefes.git
cd nefes
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Ortam değişkenlerini ayarlayın (.env.local):
```env
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key
NEXT_PUBLIC_MAPTILER_STYLE_URL=your_maptiler_style_url
OPENAQ_API_KEY=your_openaq_api_key
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

5. Tarayıcınızda http://localhost:3000 adresini ziyaret edin.

### Build ve Deployment

```bash
# Production build
npm run build

# Production sunucusu
npm start

# Kod kalitesi kontrolü
npm run lint
```

## API Entegrasyonu

### Maptiler Integration
Proje, harita görselleştirmesi için Maptiler servisini kullanır. Custom stil URL'leri ve API anahtarı konfigürasyonu desteklenir.

### OpenAQ Platform
Hava kalitesi verileri için OpenAQ API'si kullanılır. Gerçek zamanlı ve geçmiş veriler Next.js API routes üzerinden proxy edilir.

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT Lisansı altında dağıtılmaktadır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.

## Yazar

**Umut Can** - [umutcandev](https://github.com/umutcandev)