'use client';

import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { logger, criticalError } from '@/lib/logger';
import { Info } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import InfoDialog from './InfoDialog';

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
  const geolocateControl = useRef<maplibregl.GeolocateControl | null>(null);
  const initialLocationSet = useRef(false); // İlk konum ayarlandığında `true` olacak
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [API_KEY] = useState(process.env.NEXT_PUBLIC_MAPTILER_API_KEY);
  const [STYLE_URL] = useState(process.env.NEXT_PUBLIC_MAPTILER_STYLE_URL);


  useEffect(() => {
    if (map.current) return; // Harita zaten initialize edilmişse çık

    if (!API_KEY || !STYLE_URL) {
      criticalError('Maptiler API anahtarı veya style URL bulunamadı. .env.local dosyasını kontrol edin.');
      return;
    }

    if (!mapContainer.current) return;

    // Always initialize map - don't wait for coordinates

    // Özel harita style URL'ini kullan
    const styleUrl = STYLE_URL;

    // Harita merkezini ayarla
    const mapCenter: [number, number] = [longitude, latitude];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: mapCenter,
      zoom: showUserLocation ? 15 : zoom, // Kullanıcı konumu için daha yakın zoom
    });

    // Harita yüklendiğinde
    map.current.on('load', () => {
      logger.log('Harita başarıyla yüklendi');
    });

    // Hata durumunda
    map.current.on('error', (e) => {
      criticalError('Harita hatası:', e);
    });

    // Custom info control
    class InfoControl implements maplibregl.IControl {
        _map?: maplibregl.Map;
        _container: HTMLElement;
        _root?: ReactDOM.Root;

        constructor() {
            this._container = document.createElement('div');
            this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        }

        onAdd = (map: maplibregl.Map) => {
            this._map = map;
            this._container.innerHTML = ''; // Clear previous content
            
            const button = document.createElement('button');
            button.className = "w-[30px] h-[30px] bg-white hover:bg-gray-100 text-gray-800 shadow-md grid place-items-center rounded-[6px]";
            button.onclick = () => setIsInfoDialogOpen(true);

            this._container.appendChild(button);

            this._root = ReactDOM.createRoot(button);
            this._root.render(<Info className="h-4 w-4" />);
            
            return this._container;
        }

        onRemove = () => {
            this._root?.unmount();
            if (this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            this._map = undefined;
        }
    }
    
    map.current.addControl(new InfoControl(), 'top-left');

    // Navigation controls ekle - mobilde üst alanda konumlandır
    const navigationControl = new maplibregl.NavigationControl();
    map.current.addControl(navigationControl, 'top-right');

    // Geolocate control oluştur ve referansını sakla
    geolocateControl.current = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      fitBoundsOptions: {
        maxZoom: 16, // Maximum zoom seviyesi, daha yumuşak bir geçiş için optimize edildi
        duration: 2500, // Animasyon süresi (ms)
        // Sadece ekranın üst yarısına odaklan
        padding: { top: 20, bottom: window.innerHeight * 0.6, left: 20, right: 20 }
      },
      showAccuracyCircle: false, // Custom marker kullandığımız için doğruluk çemberini gizle
      showUserLocation: false // Custom marker kullandığımız için varsayılan marker'ı gizle
    });

    // Geolocate control event'lerini dinle
    geolocateControl.current.on('geolocate', (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = position.coords;
      setCurrentPosition({ lat, lng });
      logger.log('GeolocationControl - Yeni konum:', lat, lng);
      
      // Konum marker'ını ekranın üst yarısında göstermek için haritayı uygun şekilde hizala
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Mobilde floating box'ın altında kalmaması için haritayı biraz yukarı kaydır
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 2000,
          // Merkezi biraz yukarıya kaydır ki marker üst yarıda kalsın
          offset: [0, -window.innerHeight * 0.15]
        });
      } else {
        // Desktop'ta normal flyTo
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 2000
        });
      }
    });

    geolocateControl.current.on('trackuserlocationstart', () => {
      logger.log('GeolocationControl - Konum takibi başladı');
    });

    geolocateControl.current.on('trackuserlocationend', () => {
      logger.log('GeolocationControl - Konum takibi durdu');
    });

    geolocateControl.current.on('error', (error) => {
      criticalError('GeolocationControl - Hata:', error);
    });

    // Control'ü haritaya ekle - mobilde üst alanda
    map.current.addControl(geolocateControl.current, 'top-right');

  }, [API_KEY, STYLE_URL, showUserLocation, latitude, longitude, zoom]); // Yalnızca başlangıçta çalışacak bağımlılıklar


  // Kullanıcı konumu marker'ını yöneten effect - props'tan gelen koordinatlar için
  useEffect(() => {
    if (!map.current || !showUserLocation) return;

    // İlk başlangıç koordinatları için marker oluştur
    if (!currentPosition && longitude && latitude && longitude !== 29.1244 && latitude !== 40.9128) {
      setCurrentPosition({ lat: latitude, lng: longitude });
    }
  }, [longitude, latitude, showUserLocation, currentPosition]);

  // GeolocationControl'den gelen güncellemeler ve props'tan gelen başlangıç koordinatları için marker yönetimi
  useEffect(() => {
    if (!map.current || !showUserLocation) return;

    const effectivePosition = currentPosition || (longitude && latitude && longitude !== 29.1244 && latitude !== 40.9128 ? { lat: latitude, lng: longitude } : null);
    
    if (!effectivePosition) {
      // Marker'ı kaldır
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
      initialLocationSet.current = false;
      return;
    }

    // Yeni marker elementi oluştur
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = '<div class="pulse-ring"></div><div class="accuracy-circle"></div><div class="dot"></div>';

    // Eğer marker zaten varsa, sadece pozisyonunu güncelle
    if (userLocationMarker.current) {
      userLocationMarker.current.setLngLat([effectivePosition.lng, effectivePosition.lat]);
      logger.debug('Marker pozisyonu güncellendi:', effectivePosition.lat, effectivePosition.lng);
    } else {
      // Yeni marker oluştur
      userLocationMarker.current = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([effectivePosition.lng, effectivePosition.lat])
        .addTo(map.current);
      logger.debug('Yeni marker oluşturuldu:', effectivePosition.lat, effectivePosition.lng);
    }

    // İlk konumun ayarlandığını işaretle ve merkezi ayarla
    if (!initialLocationSet.current) {
      initialLocationSet.current = true;
      
      // Harita merkezini kullanıcı konumuna flyTo ile götür
      const isMobile = window.innerWidth < 768;
      if (map.current) {
        setTimeout(() => {
          if (isMobile) {
            // Mobilde floating box'ın altında kalmaması için offset ile
            map.current?.flyTo({
              center: [effectivePosition.lng, effectivePosition.lat],
              zoom: 16,
              duration: 1500,
              offset: [0, -window.innerHeight * 0.15]
            });
          } else {
            // Desktop'ta normal flyTo
            map.current?.flyTo({
              center: [effectivePosition.lng, effectivePosition.lat],
              zoom: 16,
              duration: 1500
            });
          }
        }, 500);
      }
    }

  }, [currentPosition, longitude, latitude, showUserLocation]);


  // Window resize event'ini dinle ve mobil konumlandırmayı güncelle
  useEffect(() => {
    const handleResize = () => {
      if (map.current && currentPosition) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Resize sonrası marker'ın tekrar üst yarıda kalmasını sağla
          setTimeout(() => {
            map.current?.flyTo({
              center: [currentPosition.lng, currentPosition.lat],
              zoom: 16,
              duration: 1000,
              offset: [0, -window.innerHeight * 0.15]
            });
          }, 100);
        } else {
          // Desktop'ta merkeze getir
          setTimeout(() => {
            map.current?.flyTo({
              center: [currentPosition.lng, currentPosition.lat],
              zoom: 16,
              duration: 1000,
              offset: [0, 0]
            });
          }, 100);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPosition]);

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

  // No loading state for map - show immediately

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      <InfoDialog isOpen={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen} />
    </div>
  );
}
