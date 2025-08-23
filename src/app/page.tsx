'use client';

import { useState, useEffect } from 'react';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import Map from '@/components/Map';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { 
    latitude, 
    longitude, 
    error, 
    loading, 
    permissionState, 
    requestPermission 
  } = useLocationPermission();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Carousel data
  const carouselData = [
    { id: 'overview', title: 'Genel Bakış', emoji: '📊' },
    { id: 'aqi', title: 'Hava Kalitesi', emoji: '🌬️' },
    { id: 'pollutants', title: 'Kirleticiler', emoji: '🏭' },
    { id: 'forecast', title: 'Tahmin', emoji: '📈' },
  ];

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  // Carousel API setup
  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Quick access tag click handler
  const handleTagClick = (index: number) => {
    api?.scrollTo(index);
  };

  // İzin durumuna göre dialog görünürlüğünü kontrol et
  useEffect(() => {
    if (permissionState === 'granted') {
      setShowPermissionDialog(false);
    } else if (permissionState === 'prompt' || permissionState === 'denied') {
      setShowPermissionDialog(true);
    } else if (permissionState === 'unknown') {
      // unknown durumunda localStorage'dan veri yüklenmiş mi kontrol et
      // Eğer koordinatlar varsa modal gösterme
      if (!latitude || !longitude) {
        setShowPermissionDialog(true);
      }
    }
  }, [permissionState, latitude, longitude]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Konum izni verildikten sonra haritayı göster */}
      {permissionState === 'granted' && latitude && longitude ? (
        <Map 
          latitude={latitude} 
          longitude={longitude} 
          zoom={15}
          className="h-full w-full"
          showUserLocation={true}
        />
      ) : (
        <div className="h-full w-full bg-gray-50 dark:bg-gray-900" />
      )}
      
      {/* Floating Chart Container with Carousel */}
      <div className="floating-chart absolute bottom-0 sm:bottom-4 left-0 sm:left-4 right-0 sm:right-4 h-[50vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="h-full p-3 md:p-4 flex flex-col">
          {/* Chart header */}
          <div className="flex-shrink-0 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Hava Kalitesi Verileri</h3>
          </div>
 
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick access tags */}
            <div className="flex-shrink-0 mb-3">
              <div className="flex gap-2 flex-wrap">
                {carouselData.map((item, index) => (
                  <Badge
                    key={item.id}
                    variant={current === index + 1 ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-xs px-2.5 py-1"
                    onClick={() => handleTagClick(index)}
                  >
                    <span className="mr-1">{item.emoji}</span>
                    {item.title}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Carousel content area */}
            <div className="h-full">
              <Carousel setApi={setApi} className="h-full">
                <CarouselContent className="h-full">
                  {carouselData.map((item, index) => (
                    <CarouselItem key={item.id} className="h-full">
                      <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="text-4xl mb-3">{item.emoji}</div>
                          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                            {index === 0 && "Genel hava kalitesi durumu ve önemli metrikler"}
                            {index === 1 && "AQI değeri ve hava kalitesi seviyesi"}
                            {index === 2 && "PM2.5, PM10, NO2, O3 ve diğer kirleticiler"}
                            {index === 3 && "24 saatlik hava kalitesi tahmini"}
                          </p>
                          
                          {/* Placeholder content for each slide */}
                          <div className="w-full max-w-sm">
                            {index === 0 && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AQI</div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">--</div>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Durum</div>
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">--</div>
                                </div>
                              </div>
                            )}
                            {index === 1 && (
                              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">--</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">AQI Değeri</div>
                                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                  <div className="h-2 bg-blue-500 rounded-full w-0"></div>
                                </div>
                              </div>
                            )}
                            {index === 2 && (
                              <div className="space-y-2">
                                {['PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'CO', 'Pb'].map((pollutant) => (
                                  <div key={pollutant} className="bg-white dark:bg-gray-700 p-2 rounded-lg flex justify-between items-center">
                                    <span className="text-sm font-medium">{pollutant}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">-- μg/m³</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {index === 3 && (
                              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-center mb-3">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">24 Saatlik Trend</div>
                                </div>
                                <div className="h-20 bg-gray-100 dark:bg-gray-600 rounded flex items-end justify-center">
                                  <div className="text-xs text-gray-500">Grafik alanı</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onRequestPermission={handlePermissionRequest}
        permissionState={permissionState}
        error={error}
        loading={loading}
      />
    </div>
  );
}
