# Nefes

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.15.4-8884D8?logo=recharts&logoColor=white)](https://recharts.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5.6.2-396CB2?logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Open Meteo](https://img.shields.io/badge/Open_Meteo-API-4285F4?logo=google-earth&logoColor=white)](https://open-meteo.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

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
- **8 Analitik Karousel** - Embla Carousel ile organize edilmiş veri analiz kategorileri:
  1. **Genel Bakış**: Anlık AQI, ana kirletici, 24 saatlik özet scroll
  2. **Hava Kalitesi**: Area chart ile AQI trendi, PM oranı analizi, NO₂ trend
  3. **Kirleticiler**: Bar chart ile konsantrasyonlar, 12 saatlik trend analizi
  4. **Korelasyonlar**: PM2.5 korelasyon katsayıları, scatter plot analizi
  5. **Zaman Analizi**: En temiz/kirli saatler, şehir karşılaştırması
  6. **Bireysel AQI**: Radial charts ile kirletici-bazlı AQI hesaplaması
  7. **Aktivite Önerileri**: Spor/yürüyüş/çocuk güvenlik analizi
  8. **Şehir Karşılaştırması**: 9 şehir için horizontal bar chart ranking
- **İnteraktif Grafikler** - Recharts ile oluşturulmuş modern chart bileşenleri:
  - AreaChart: 24 saatlik AQI trend analizi (natural spline)
  - BarChart: Kirletici konsantrasyonlarının karşılaştırmalı görünümü
  - LineChart: 12 saatlik multi-pollutant trend analizi
  - ScatterChart: PM2.5 vs PM10 korelasyon analizi
  - RadialBarChart: Bireysel kirletici AQI gösterimi
- **Dinamik Badge Navigasyon** - Karousel durumuna göre aktif/pasif badge sistemi
- **Gerçek Zamanlı Scroll Kontrolleri** - Touch/mouse ile smooth horizontal scrolling
- **Responsive Design** - Mobil ve desktop için optimize edilmiş chart görünümleri
- **Real-time Tooltips** - Hover/touch ile detaylı veri keşfi ve matematik hesapları

### Kullanıcı Deneyimi
- **Floating Chart Container**: Harita üzerinde dinamik konumlandırılmış veri paneli
- **Progressive Loading**: Her karousel için özelleştirilmiş skeleton UI
- **API Durumu Gösterimi**: Fallback veri uyarıları ve retry counter
- **Touch/Swipe Desteği**: Mobil cihazlarda gesture tabanlı navigasyon
- **Dinamik Badge Sistem**: Karousel içeriğine göre otomatik güncellenen navigasyon
- **Responsive Breakpoints**: Mobil/tablet/desktop için optimize chart boyutları
- **Smooth Animations**: 60fps carousel geçişleri ve chart transition'ları
- **Konum izin yönetimi**: LocationPermissionDialog ile kullanıcı bilgilendirmesi

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

### Veri Görselleştirme
- **Recharts 2.15.4** - React için composable grafik kütüphanesi
  - LineChart, BarChart, AreaChart bileşenleri
  - Responsive tasarım ve interaktif tooltip desteği
  - AQI trendleri ve kirletici verilerinin görselleştirilmesi
- **Embla Carousel React 8.6.0** - Performanslı carousel/slider bileşeni
  - Touch/swipe desteği ve smooth animasyonlar
  - Veri kategorileri arasında geçiş için kullanılıyor

### Yardımcı Kütüphaneler
- **class-variance-authority** - Tip güvenli CSS varyant yöneticisi
- **clsx & tailwind-merge** - Dinamik CSS sınıf yönetimi
- **tw-animate-css** - Tailwind için ek animasyon utilities

### Custom Hooks
- **useLocationPermission** - Gelişmiş konum izin durumu yöneticisi
  - Tarayıcı geolocation API'si entegrasyonu
  - İzin durumu tracking ve error handling
  - Otomatik konum güncelleme ve caching
- **useMediaQuery** - Responsive breakpoint hook
  - CSS media query'lerin React'ta kullanımı
  - Dinamik responsive tasarım kontrolü

### Karousel Yönetimi
- **Embla Carousel API Integration** - Programmatik carousel kontrolü
  - `setApi()` ve `api.scrollTo()` ile badge navigation
  - `api.selectedScrollSnap()` ile aktif panel tracking
  - Event listener tabanlı state synchronization
- **Horizontal Scroll Controllers** - Saatlik veri için özel scroll sistemi
  - `updateScrollButtons()` ile scroll boundary detection
  - `scrollHourlyLeft/Right()` ile card-based navigation
  - 3 kart × 56px hesaplama ile smooth scrolling

### Geliştirme Araçları
- **ESLint 9** - Kod kalitesi ve stil kontrolü
- **Turbopack** - Hızlı geliştirme ve build süreçleri
- **PostCSS** - CSS işleme ve optimizasyon

### Veri Kaynağı
- **Open Meteo Air Quality API** - Ücretsiz hava kalitesi veri sağlayıcısı
  - European AQI standartlarında gerçek zamanlı veriler
  - 24 saatlik saatlik tahmin verileri
  - PM2.5, PM10, NO₂, O₃, SO₂, CO kirletici parametreleri
- **Next.js API Routes** - Backend katmanı ve veri işleme (opsiyonel)

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
│   │   │   ├── chart.tsx        # Recharts için chart container bileşeni
│   │   │   ├── carousel.tsx     # Embla carousel bileşeni
│   │   │   └── ...              # Diğer UI bileşenleri
│   │   ├── Map.tsx              # MapLibre harita bileşeni
│   │   └── LocationPermissionDialog.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Konum API hook
│   │   ├── useLocationPermission.ts
│   │   └── useMediaQuery.ts     # Responsive hook
│   └── lib/
│       ├── utils.ts             # Yardımcı fonksiyonlar
│       └── logger.ts            # Development/Production log utility
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
# Open Meteo API ücretsizdir, anahtar gerekmez
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

## Veri Analizi ve Matematiksel Fonksiyonlar

### Temel Analiz Fonksiyonları

#### AQI Hesaplama ve Değerlendirme
- **getAQIStatus()**: European AQI standartlarına göre hava kalitesi durumunu belirleme (Çok İyi: ≤20, İyi: ≤40, Orta: ≤60, Kötü: ≤80, Çok Kötü: ≤100, Tehlikeli: >100)
- **getAQIColor()**: AQI değerlerine göre dinamik renk kodlama sistemi
- **getMainPollutant()**: WHO sağlık standartlarına göre ana kirleticiyi tespit etme ve eşik değer analizi

#### Bireysel Kirletici AQI Hesaplama
- **calculateIndividualAQI()**: Her kirletici için ayrı AQI hesaplama sistemi
- European AQI breakpoint tabloları kullanılarak linear interpolasyon
- PM2.5, PM10, NO₂, O₃, SO₂, CO için özel hesaplama algoritmaları
- Matematiksel formül: `AQI = ((AQI_high - AQI_low) / (Value_high - Value_low)) × (Value - Value_low) + AQI_low`

### İstatistiksel Analiz Fonksiyonları

#### Korelasyon Analizi
- **calculateCorrelation()**: Pearson korelasyon katsayısı hesaplama
- PM2.5 ile diğer kirleticiler arasındaki ilişki analizi
- Matematiksel formül: `r = (n∑xy - ∑x∑y) / √[(n∑x² - (∑x)²)(n∑y² - (∑y)²)]`
- Korelasyon gücü değerlendirmesi (Güçlü: |r| > 0.7, Orta: |r| > 0.5, Zayıf: |r| ≤ 0.5)

#### Extreme Değer Analizi
- **getExtremeHours()**: 24 saatlik veriden en temiz ve en kirli saatleri tespit
- Array.reduce() algoritması ile minimum/maksimum değer bulma
- Zaman bazlı trend analizi için kullanılıyor

### Sağlık Odaklı Analiz Sistemleri

#### Aktivite Önerisi Algoritması
- **getActivityRecommendations()**: AQI değerlerine göre aktivite güvenlik analizi
- Spor aktiviteleri: AQI < 50 filtresi
- Çocuk aktiviteleri: AQI < 40 filtresi (daha hassas eşik)
- Yürüyüş aktiviteleri: AQI < 60 filtresi
- Gerçek zamanlı güvenlik durumu değerlendirmesi

#### Kirletici Sağlık Risk Analizi
- **getPollutantStatus()**: WHO eşik değerlerine göre kirletici risk değerlendirmesi
- Orantısal risk hesaplama: `risk_ratio = measured_value / WHO_threshold`
- Durum kategorileri: Çok İyi (≤0.5), İyi (≤0.8), Orta (≤1.0), Kötü (≤1.5), Çok Kötü (>1.5)

### Veri İşleme ve Filtreleme

#### Dinamik Veri Filtreleme
- **Array.filter()** ve **Array.map()** kombinasyonları ile gerçek zamanlı veri işleme
- Geçersiz veri noktallarının otomatik temizlenmesi
- Zaman bazlı veri dilimleme (slice operations)

#### Interpolasyon ve Smoothing
- Linear interpolasyon ile eksik veri noktalarının doldurulması
- Zaman serisi verilerinde smooth geçişler
- Chart'larda "natural" spline interpolasyonu kullanımı

### Şehir Karşılaştırma Algoritması

#### Çoklu API Koordinasyonu
- **fetchCityComparisons()**: 9 farklı şehir için paralel API çağrıları
- **Promise.all()** ile eşzamanlı veri toplama
- Başarısız API çağrılarının otomatik filtrelenmesi
- Coğrafi koordinat bazlı doğruluk kontrolü

#### Sıralama ve Ranking
- AQI değerlerine göre şehirlerin otomatik sıralanması
- Mevcut konumun relatif pozisyon analizi
- Daha temiz şehir sayısının hesaplanması

### Gerçek Zamanlı Veri Optimizasyonu

#### API Retry Mekanizması
- **fetchWithRetry()**: Exponential backoff algoritması
- 3 deneme hakkı ile güvenilirlik artırma
- Ağ hatalarına karşı dayanıklılık

#### Koordinat Hassasiyet Kontrolü
- 0.001 derece hassasiyetle konum değişikliği tespiti
- Gereksiz API çağrılarının önlenmesi
- Cache tabanlı veri yönetimi

## API Entegrasyonu

### Maptiler Integration
Proje, harita görselleştirmesi için Maptiler servisini kullanır. Custom stil URL'leri ve API anahtarı konfigürasyonu desteklenir.

### Open Meteo Air Quality API
Hava kalitesi verileri için Open Meteo API'si kullanılır:
- **ECMWF CAMS** (Copernicus Atmosphere Monitoring Service) veri kaynağı
- **11km grid çözünürlüğü** ile yerel doğruluk
- Ücretsiz ve API anahtarı gerektirmez
- European AQI standartlarında saatlik veriler
- CORS desteği ile doğrudan frontend entegrasyonu
- Gerçek zamanlı ve 24 saatlik tahmin verileri
- Uydu destekli atmosferik ölçümler

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