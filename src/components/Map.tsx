'use client';

import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  className?: string;
  showUserLocation?: boolean;
}

export default function Map({ 
  longitude = 29.1244, 
  latitude = 40.9128, 
  zoom = 10, 
  className = '',
  showUserLocation = false
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const initialLocationSet = useRef(false); // İlk konum ayarlandığında `true` olacak
  const [API_KEY] = useState(process.env.NEXT_PUBLIC_MAPTILER_API_KEY);
  const [STYLE_URL] = useState(process.env.NEXT_PUBLIC_MAPTILER_STYLE_URL);


  useEffect(() => {
    if (map.current) return; // Harita zaten initialize edilmişse çık

    if (!API_KEY || !STYLE_URL) {
      console.error('Maptiler API anahtarı veya style URL bulunamadı. .env.local dosyasını kontrol edin.');
      return;
    }

    if (!mapContainer.current) return;

    // Eğer kullanıcı konumu bekleniyor ama henüz gerçek koordinatlar yoksa, bekle
    if (showUserLocation && (!longitude || !latitude || longitude === 29.1244)) {
      return;
    }

    // Kullanıcı konumu bekleniyorsa ve henüz varsayılan koordinatlardaysa bekle
    if (showUserLocation && latitude === 40.9128) {
      return;
    }

    // Özel harita style URL'ini kullan
    const styleUrl = STYLE_URL;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [longitude, latitude],
      zoom: showUserLocation ? 15 : zoom, // Kullanıcı konumu için daha yakın zoom
    });

    // Harita yüklendiğinde
    map.current.on('load', () => {
      console.log('Harita başarıyla yüklendi');
    });

    // Hata durumunda
    map.current.on('error', (e) => {
      console.error('Harita hatası:', e);
    });

    // Navigation controls ekle
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Geolocate control ekle
    map.current.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      fitBoundsOptions: {
        maxZoom: 16, // Maximum zoom seviyesi, daha yumuşak bir geçiş için optimize edildi
        duration: 2500, // Animasyon süresi (ms)
      },
      showAccuracyCircle: true, // Doğruluk çemberini göster
      showUserLocation: true // Kullanıcı konumu noktasını göster
    }), 'top-right');

  }, [API_KEY, STYLE_URL, showUserLocation, latitude, longitude, zoom]); // Yalnızca başlangıçta çalışacak bağımlılıklar


  // Kullanıcı konumu marker'ını yöneten effect
  useEffect(() => {
    if (!map.current) return; // Harita hazır değilse çık

    // Geçerli koordinat yoksa ve kullanıcı konumu gösteriliyorsa, marker'ı kaldırma
    if (showUserLocation && (!longitude || !latitude)) {
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
      initialLocationSet.current = false; // Konum kaybolursa sıfırla
      return;
    }
    
    // Yeni marker elementi oluştur
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = '<div class="pulse-ring"></div><div class="accuracy-circle"></div><div class="dot"></div>';

    // Eğer marker zaten varsa, sadece pozisyonunu güncelle
    if (userLocationMarker.current) {
      userLocationMarker.current.setLngLat([longitude, latitude]);
    } else {
      // Yeni marker oluştur
      userLocationMarker.current = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }
    
    // Haritayı yeni merkeze uçur (sadece ilk konum ayarlandıktan sonra)
    if (showUserLocation && initialLocationSet.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: Math.max(map.current.getZoom(), 15), // Mevcut zoom'u koru veya 15'e yakınlaş
          duration: 2500, // Animasyon süresini uzat
          essential: true // Kullanıcı etkileşimi sırasında bile animasyonun tamamlanmasını sağla
        });
    }

    // İlk konumun ayarlandığını işaretle
    if (showUserLocation && !initialLocationSet.current) {
      initialLocationSet.current = true;
    }

  }, [longitude, latitude, showUserLocation]);


  // Component unmount olduğunda haritayı temizle
  useEffect(() => {
    return () => {
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (!API_KEY || !STYLE_URL) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Harita Yüklenemedi
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Maptiler API anahtarı veya style URL bulunamadı.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            .env.local dosyasında NEXT_PUBLIC_MAPTILER_API_KEY ve NEXT_PUBLIC_MAPTILER_STYLE_URL değişkenlerini kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  // Kullanıcı konumu beklenirken loading state göster
  if (showUserLocation && (!longitude || !latitude || longitude === 29.1244 || latitude === 40.9128)) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Konumunuz alınıyor...
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Harita konumunuz belirlendikten sonra yüklenecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
