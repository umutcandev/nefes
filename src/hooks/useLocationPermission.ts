'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface LocationPermissionState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  isWatching: boolean;
}

export const useLocationPermission = () => {
  const [state, setState] = useState<LocationPermissionState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permissionState: 'unknown',
    isWatching: false,
  });
  
  const [watchId, setWatchId] = useState<number | null>(null);

  // İzin durumunu kontrol et
  const checkPermissionState = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    if (!navigator.permissions || !navigator.geolocation) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'unknown';
    }
  };

  // Konum bilgisini al
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation bu tarayıcıda desteklenmiyor'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 dakika cache - F5 sonrası tekrar konum istemesin
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          let errorMessage = 'Konum alınamadı';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini etkinleştirin.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Konum bilgisi mevcut değil. GPS sinyal kalitesini kontrol edin.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Konum alma işlemi zaman aşımına uğradı. Tekrar deneyin.';
              break;
            default:
              errorMessage = 'Bilinmeyen bir hata oluştu.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  // Canlı konum takibini başlat
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000, // 10 saniye cache
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const newState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
        permissionState: 'granted' as const,
        isWatching: true,
      };
      
      setState(newState);
      logger.debug('Canlı konum güncellendi:', newState.latitude, newState.longitude);
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Konum takibi hatası';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Konum izni reddedildi.';
          // Watch'ı durdur
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
          }
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Konum bilgisi mevcut değil.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Konum alma işlemi zaman aşımına uğradı.';
          break;
        default:
          errorMessage = 'Bilinmeyen bir hata oluştu.';
          break;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        isWatching: false,
      }));
    };

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    setWatchId(id);
    
    setState(prev => ({ ...prev, isWatching: true }));
  }, [watchId]);

  // Canlı konum takibini durdur
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setState(prev => ({ ...prev, isWatching: false }));
  }, [watchId]);

  // İzin iste ve konum al
  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permissionState = await checkPermissionState();
      
      if (permissionState === 'denied') {
        setState(prev => ({
          ...prev,
          permissionState: 'denied',
          error: 'Konum izni daha önce reddedilmiş. Lütfen tarayıcı ayarlarından izni manuel olarak etkinleştirin.',
          loading: false,
        }));
        return;
      }

      // Konum bilgisini almaya çalış
      const position = await getCurrentLocation();
      
      const newState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
        permissionState: 'granted' as const,
        isWatching: false,
      };
      
      setState(newState);

      // İzin verildikten sonra canlı takibi başlat
      startWatching();

    } catch (error: unknown) {
      const newPermissionState = await checkPermissionState();
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
        loading: false,
        permissionState: newPermissionState,
      }));
    }
  }, [startWatching]);

  // Sayfa yüklendiğinde izin durumunu kontrol et
  useEffect(() => {
    const initializePermission = async () => {
      const permissionState = await checkPermissionState();
      
      setState(prev => ({
        ...prev,
        permissionState,
      }));

      // Eğer izin zaten verilmişse ve konum bilgisi yoksa konumu al
      if (permissionState === 'granted') {
        try {
          const position = await getCurrentLocation();
          
          const newState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
            permissionState: 'granted' as const,
            isWatching: false,
          };
          
          setState(newState);
          
          // İzin verildikten sonra canlı takibi başlat
          setTimeout(() => startWatching(), 100);
          
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Konum alınamadı',
            loading: false,
          }));
        }
      }
    };

    initializePermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // İzin durumu değişikliklerini dinle
  useEffect(() => {
    if (!navigator.permissions) return;

    const handlePermissionChange = async () => {
      const newPermissionState = await checkPermissionState();
      setState(prev => ({
        ...prev,
        permissionState: newPermissionState,
      }));

      // İzin verilirse ve konum bilgisi yoksa konumu al
      if (newPermissionState === 'granted') {
        setState(current => {
          if (!current.latitude && !current.loading) {
            // Konum bilgisi yoksa al
            getCurrentLocation()
              .then(position => {
                setState(prev => ({
                  ...prev,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  error: null,
                  loading: false,
                }));
                // Canlı takibi başlat
                setTimeout(() => startWatching(), 100);
              })
              .catch(error => {
                setState(prev => ({
                  ...prev,
                  error: error instanceof Error ? error.message : 'Konum alınamadı',
                  loading: false,
                }));
              });
          }
          return current;
        });
      }
    };

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name: 'geolocation' })
      .then(status => {
        permissionStatus = status;
        status.addEventListener('change', handlePermissionChange);
      })
      .catch(() => {
        // İzin API'si desteklenmiyorsa sessizce başarısız ol
      });

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [startWatching]); // Sadece startWatching dependency'si

  const clearPermissions = () => {
    stopWatching(); // Konum takibini durdur
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
      permissionState: 'unknown',
      isWatching: false,
    });
  };

  // Component unmount olduğunda konum takibini temizle
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...state,
    requestPermission,
    clearPermissions,
    startWatching,
    stopWatching,
  };
};
