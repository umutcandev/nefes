'use client';

import { useState, useEffect } from 'react';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import Map from '@/components/Map';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';

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

  const handlePermissionRequest = async () => {
    await requestPermission();
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
