'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import Map from '@/components/Map';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';
import { logger, criticalError } from '@/lib/logger';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, ScatterChart, Scatter } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [dataLoading, setDataLoading] = useState(false);
  const badgeContainerRef = useRef<HTMLDivElement>(null);
  interface AirQualityData {
    current: {
      aqi: number;
      status: string;
      pm25: number;
      pm10: number;
      no2: number;
      o3: number;
      so2: number;
      co: number;
    };
    hourly: Array<{
      time: string;
      aqi: number;
      pm25: number;
      pm10: number;
      no2: number;
      o3: number;
      so2: number;
      co: number;
    }>;
    pollutants: Array<{
      name: string;
      value: number;
      unit: string;
      color: string;
    }>;
  }

  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [lastFetchedCoordinates, setLastFetchedCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [cityComparisons, setCityComparisons] = useState<{
    name: string;
    aqi: number;
    current: boolean;
    color: string;
  }[]>([]);
  const [cityDataLoading, setCityDataLoading] = useState(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [apiRetryCount, setApiRetryCount] = useState(0);

  // Carousel data
  const carouselData = [
    { id: 'overview', title: 'Genel Bakış', emoji: '📊' },
    { id: 'aqi', title: 'Hava Kalitesi', emoji: '🌬️' },
    { id: 'pollutants', title: 'Kirleticiler', emoji: '🏭' },
    { id: 'correlations', title: 'Korelasyonlar', emoji: '📈' },
    { id: 'timeline', title: 'Zaman Analizi', emoji: '⏰' },
    { id: 'individual-aqi', title: 'Bireysel AQI', emoji: '🎯' },
    { id: 'activities', title: 'Aktivite Önerileri', emoji: '🏃‍♂️' },
    { id: 'city-comparison', title: 'Şehir Karşılaştırması', emoji: '🌍' },
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

  // Badge'i görünür alana scroll eden fonksiyon
  const scrollBadgeIntoView = useCallback((index: number) => {
    if (!badgeContainerRef.current) return;
    
    const container = badgeContainerRef.current;
    const badges = container.children;
    if (!badges[index]) return;
    
    const badge = badges[index] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    
    // Badge container'ın scroll pozisyonu
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    // Badge'in container içindeki relatif pozisyonu
    const badgeLeft = badge.offsetLeft;
    const badgeWidth = badge.offsetWidth;
    
    // Badge görünür alanda değilse scroll et
    if (badgeLeft < scrollLeft) {
      // Sol tarafta gizli - sola scroll
      container.scrollTo({ left: badgeLeft - 10, behavior: 'smooth' });
    } else if (badgeLeft + badgeWidth > scrollLeft + containerWidth) {
      // Sağ tarafta gizli - sağa scroll
      container.scrollTo({ left: badgeLeft + badgeWidth - containerWidth + 10, behavior: 'smooth' });
    }
  }, []);

  // Carousel değiştiğinde badge'i scroll et
  useEffect(() => {
    if (current > 0) {
      // current 1-indexed, array 0-indexed
      scrollBadgeIntoView(current - 1);
    }
  }, [current, scrollBadgeIntoView]);

  // Quick access tag click handler
  const handleTagClick = (index: number) => {
    api?.scrollTo(index);
  };

  // Check scroll boundaries
  const updateScrollButtons = (container: HTMLElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Hourly scroll handlers
  const scrollHourlyLeft = () => {
    const container = document.getElementById('hourly-scroll-container');
    if (container && canScrollLeft) {
      const cardWidth = 56; // 48px width + 8px gap
      const scrollAmount = cardWidth * 3; // 3 cards at a time
      const newPosition = Math.max(0, container.scrollLeft - scrollAmount);
      container.scrollTo({ 
        left: newPosition, 
        behavior: 'smooth'
      });
    }
  };

  const scrollHourlyRight = () => {
    const container = document.getElementById('hourly-scroll-container');
    if (container && canScrollRight) {
      const cardWidth = 56; // 48px width + 8px gap
      const scrollAmount = cardWidth * 3; // 3 cards at a time
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(maxScroll, container.scrollLeft + scrollAmount);
      container.scrollTo({ 
        left: newPosition, 
        behavior: 'smooth'
      });
    }
  };

  // İzin durumuna göre dialog görünürlüğünü kontrol et
  useEffect(() => {
    // Sadece prompt veya denied durumlarında dialog göster
    // Unknown durumunda da dialog gösterme - çünkü bu ilk yükleme anını gösterir
    if (permissionState === 'prompt' || permissionState === 'denied') {
      setShowPermissionDialog(true);
    } else if (permissionState === 'granted') {
      setShowPermissionDialog(false);
    }
    // 'unknown' durumunda dialog'u açık bırakma - sistem determine edene kadar bekle
  }, [permissionState]);

  // Retry mekanizması ile API çağrısı
  const fetchWithRetry = async (url: string, maxRetries: number = 3): Promise<Response> => {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        setApiRetryCount(i);
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`API attempt ${i + 1} failed:`, error);
        
        // Son deneme değilse bekle
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  };

  // Open Meteo API'sinden hava kalitesi verilerini çek - Sadece gerektiğinde
  const fetchAirQualityData = useCallback(async (lat: number, lon: number, forceRefresh: boolean = false) => {
    // Eğer aynı koordinatlar için zaten veri çektiyse ve force refresh değilse, çekme
    if (!forceRefresh && lastFetchedCoordinates && 
        Math.abs(lastFetchedCoordinates.lat - lat) < 0.001 && 
        Math.abs(lastFetchedCoordinates.lon - lon) < 0.001 && 
        airQualityData) {

      return;
    }

    setDataLoading(true);
    setIsUsingFallbackData(false);
    setApiRetryCount(0);
    
    try {
      // Open Meteo Air Quality API çağrısı - retry mekanizması ile
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,european_aqi&forecast_days=1&timezone=auto`;
      const response = await fetchWithRetry(url, 3);
      const data = await response.json();

      
      // API verilerini kontrol et
      if (!data.hourly || !data.hourly.european_aqi || !data.hourly.time) {
        logger.error('Invalid API response structure:', data);
        logger.warn('🚨 Fallback veriye geçiliyor - kullanıcı uyarılacak!');
        setIsUsingFallbackData(true);
        
        // Demo veri seti kullan (geçici)
        const realHourlyData = {
          "time": [
            "2025-08-25T00:00", "2025-08-25T01:00", "2025-08-25T02:00", "2025-08-25T03:00",
            "2025-08-25T04:00", "2025-08-25T05:00", "2025-08-25T06:00", "2025-08-25T07:00",
            "2025-08-25T08:00", "2025-08-25T09:00", "2025-08-25T10:00", "2025-08-25T11:00",
            "2025-08-25T12:00", "2025-08-25T13:00", "2025-08-25T14:00", "2025-08-25T15:00",
            "2025-08-25T16:00", "2025-08-25T17:00", "2025-08-25T18:00", "2025-08-25T19:00",
            "2025-08-25T20:00", "2025-08-25T21:00", "2025-08-25T22:00", "2025-08-25T23:00"
          ],
          "pm10": [7.2, 6.9, 7, 7.2, 7.6, 8.1, 8.9, 8.9, 7.3, 7.4, 8, 8.7, 9.1, 10, 10.2, 9.7, 9.4, 8.4, 8.1, 8.3, 8.6, 8.2, 8.7, 8.6],
          "pm2_5": [6.5, 6.4, 6.5, 6.6, 6.6, 6.7, 7.3, 7.1, 6.3, 6.3, 6.5, 6.6, 6.7, 6.9, 6.8, 6.5, 6.3, 6, 5.7, 5.6, 5.5, 5.5, 5.7, 5.9],
          "nitrogen_dioxide": [3.3, 3.3, 3, 3, 3.3, 3.6, 3.9, 4.5, 3.7, 3.7, 2.6, 2.1, 1.7, 1.5, 1.4, 1.3, 1.3, 1.5, 1.7, 2.9, 5, 5.7, 4.4, 4.2],
          "ozone": [82, 79, 75, 71, 67, 65, 63, 60, 64, 71, 78, 90, 101, 106, 109, 109, 109, 107, 105, 102, 91, 86, 83, 80],
          "sulphur_dioxide": [1.4, 1.4, 1.5, 1.7, 1.9, 1.9, 1.9, 2.1, 1.8, 1.7, 1.5, 1.4, 1.3, 1.3, 1.2, 1.1, 1, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.9],
          "carbon_monoxide": [143, 143, 140, 139, 139, 140, 142, 145, 144, 144, 141, 139, 137, 135, 132, 129, 129, 128, 127, 131, 142, 142, 140, 140],
          "european_aqi": [33, 32, 30, 28, 27, 26, 25, 24, 26, 28, 31, 36, 41, 44, 46, 46, 46, 45, 43, 41, 36, 34, 33, 32]
        };

        const currentHour = new Date().getHours();
        const currentIndex = Math.min(currentHour, realHourlyData.european_aqi.length - 1);
        
        const mockData = {
          current: {
            aqi: realHourlyData.european_aqi[currentIndex],
            status: getAQIStatus(realHourlyData.european_aqi[currentIndex]),
            pm25: realHourlyData.pm2_5[currentIndex],
            pm10: realHourlyData.pm10[currentIndex],
            no2: realHourlyData.nitrogen_dioxide[currentIndex],
            o3: realHourlyData.ozone[currentIndex],
            so2: realHourlyData.sulphur_dioxide[currentIndex],
            co: realHourlyData.carbon_monoxide[currentIndex],
          },
          hourly: realHourlyData.european_aqi.map((aqi, index) => ({
            time: `${index.toString().padStart(2, '0')}:00`,
            hour: index,
            aqi: aqi,
            pm25: realHourlyData.pm2_5[index],
            pm10: realHourlyData.pm10[index],
            no2: realHourlyData.nitrogen_dioxide[index],
            o3: realHourlyData.ozone[index],
            so2: realHourlyData.sulphur_dioxide[index],
            co: realHourlyData.carbon_monoxide[index],
          })),
          pollutants: [
            { name: 'PM2.5', value: realHourlyData.pm2_5[currentIndex], unit: 'μg/m³', color: '#2d1b69' },
            { name: 'PM10', value: realHourlyData.pm10[currentIndex], unit: 'μg/m³', color: '#7c2d12' },
            { name: 'NO₂', value: realHourlyData.nitrogen_dioxide[currentIndex], unit: 'μg/m³', color: '#a16207' },
            { name: 'O₃', value: realHourlyData.ozone[currentIndex], unit: 'μg/m³', color: '#166534' },
            { name: 'SO₂', value: realHourlyData.sulphur_dioxide[currentIndex], unit: 'μg/m³', color: '#1e3a8a' },
            { name: 'CO', value: realHourlyData.carbon_monoxide[currentIndex], unit: 'μg/m³', color: '#991b1b' },
          ]
        };
        

        setAirQualityData(mockData);
        setLastFetchedCoordinates({ lat, lon });
        setHasInitialLoad(true);
        setDataLoading(false);
        return;
      }
      
      // Veriyi uygun formata çevir
      const currentHour = new Date().getHours();
      const currentIndex = Math.min(currentHour, (data.hourly?.european_aqi?.length || 1) - 1);
      
      const processedData = {
        current: {
          aqi: data.hourly?.european_aqi?.[currentIndex] || 0,
          status: getAQIStatus(data.hourly?.european_aqi?.[currentIndex] || 0),
          pm25: data.hourly?.pm2_5?.[currentIndex] || 0,
          pm10: data.hourly?.pm10?.[currentIndex] || 0,
          no2: data.hourly?.nitrogen_dioxide?.[currentIndex] || 0,
          o3: data.hourly?.ozone?.[currentIndex] || 0,
          so2: data.hourly?.sulphur_dioxide?.[currentIndex] || 0,
          co: data.hourly?.carbon_monoxide?.[currentIndex] || 0,
        },
                hourly: data.hourly?.european_aqi?.slice(0, 24).map((aqi: number, index: number) => {
          const timeStr = data.hourly.time[index];
          
          // Zaman parsing'i iyileştir
          let hour = index;
          if (timeStr) {
            // ISO format: "2025-08-25T00:00" veya benzeri
            if (timeStr.includes('T')) {
              const timePart = timeStr.split('T')[1];
              hour = parseInt(timePart.split(':')[0]);
            } else {
              hour = new Date(timeStr).getHours();
            }
          }
          
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          
          // AQI değerinin geçerli olduğundan emin ol
          const aqiValue = Number(aqi);
          const validAqi = isNaN(aqiValue) ? 0 : aqiValue;
          
          const hourlyData = {
            time: timeLabel,
            hour: hour, // Chart için saat numarası
            aqi: validAqi,
            pm25: Number(data.hourly.pm2_5?.[index]) || 0,
            pm10: Number(data.hourly.pm10?.[index]) || 0,
            no2: Number(data.hourly.nitrogen_dioxide?.[index]) || 0,
            o3: Number(data.hourly.ozone?.[index]) || 0,
            so2: Number(data.hourly.sulphur_dioxide?.[index]) || 0,
            co: Number(data.hourly.carbon_monoxide?.[index]) || 0,
          };
          
          return hourlyData;
        }).filter((item: { aqi: number | null | undefined }) => item.aqi !== null && item.aqi !== undefined) || [],
        pollutants: [
          { name: 'PM2.5', value: data.hourly?.pm2_5?.[0] || 0, unit: 'μg/m³', color: '#2d1b69' },
          { name: 'PM10', value: data.hourly?.pm10?.[0] || 0, unit: 'μg/m³', color: '#7c2d12' },
          { name: 'NO₂', value: data.hourly?.nitrogen_dioxide?.[0] || 0, unit: 'μg/m³', color: '#a16207' },
          { name: 'O₃', value: data.hourly?.ozone?.[0] || 0, unit: 'μg/m³', color: '#166534' },
          { name: 'SO₂', value: data.hourly?.sulphur_dioxide?.[0] || 0, unit: 'μg/m³', color: '#1e3a8a' },
          { name: 'CO', value: data.hourly?.carbon_monoxide?.[0] || 0, unit: 'mg/m³', color: '#991b1b' },
        ]
      };
      

      
      setAirQualityData(processedData);
      setLastFetchedCoordinates({ lat, lon });
      setHasInitialLoad(true);
    } catch (error) {
      criticalError('API çağrısı tamamen başarısız - fallback veriye geçiliyor:', error);
      setIsUsingFallbackData(true);
      
      // API başarısız olduğunda da demo veriyi kullan
      const currentHour = new Date().getHours();
      const demoHourlyData = {
        "time": [
          "2025-08-25T00:00", "2025-08-25T01:00", "2025-08-25T02:00", "2025-08-25T03:00",
          "2025-08-25T04:00", "2025-08-25T05:00", "2025-08-25T06:00", "2025-08-25T07:00",
          "2025-08-25T08:00", "2025-08-25T09:00", "2025-08-25T10:00", "2025-08-25T11:00",
          "2025-08-25T12:00", "2025-08-25T13:00", "2025-08-25T14:00", "2025-08-25T15:00",
          "2025-08-25T16:00", "2025-08-25T17:00", "2025-08-25T18:00", "2025-08-25T19:00",
          "2025-08-25T20:00", "2025-08-25T21:00", "2025-08-25T22:00", "2025-08-25T23:00"
        ],
        "pm10": [7.2, 6.9, 7, 7.2, 7.6, 8.1, 8.9, 8.9, 7.3, 7.4, 8, 8.7, 9.1, 10, 10.2, 9.7, 9.4, 8.4, 8.1, 8.3, 8.6, 8.2, 8.7, 8.6],
        "pm2_5": [6.5, 6.4, 6.5, 6.6, 6.6, 6.7, 7.3, 7.1, 6.3, 6.3, 6.5, 6.6, 6.7, 6.9, 6.8, 6.5, 6.3, 6, 5.7, 5.6, 5.5, 5.5, 5.7, 5.9],
        "nitrogen_dioxide": [3.3, 3.3, 3, 3, 3.3, 3.6, 3.9, 4.5, 3.7, 3.7, 2.6, 2.1, 1.7, 1.5, 1.4, 1.3, 1.3, 1.5, 1.7, 2.9, 5, 5.7, 4.4, 4.2],
        "ozone": [82, 79, 75, 71, 67, 65, 63, 60, 64, 71, 78, 90, 101, 106, 109, 109, 109, 107, 105, 102, 91, 86, 83, 80],
        "sulphur_dioxide": [1.4, 1.4, 1.5, 1.7, 1.9, 1.9, 1.9, 2.1, 1.8, 1.7, 1.5, 1.4, 1.3, 1.3, 1.2, 1.1, 1, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.9],
        "carbon_monoxide": [143, 143, 140, 139, 139, 140, 142, 145, 144, 144, 141, 139, 137, 135, 132, 129, 129, 128, 127, 131, 142, 142, 140, 140],
        "european_aqi": [33, 32, 30, 28, 27, 26, 25, 24, 26, 28, 31, 36, 41, 44, 46, 46, 46, 45, 43, 41, 36, 34, 33, 32]
      };

      const currentIndex = Math.min(currentHour, demoHourlyData.european_aqi.length - 1);
      
      const fallbackData = {
        current: {
          aqi: demoHourlyData.european_aqi[currentIndex],
          status: getAQIStatus(demoHourlyData.european_aqi[currentIndex]),
          pm25: demoHourlyData.pm2_5[currentIndex],
          pm10: demoHourlyData.pm10[currentIndex],
          no2: demoHourlyData.nitrogen_dioxide[currentIndex],
          o3: demoHourlyData.ozone[currentIndex],
          so2: demoHourlyData.sulphur_dioxide[currentIndex],
          co: demoHourlyData.carbon_monoxide[currentIndex],
        },
        hourly: demoHourlyData.european_aqi.map((aqi, index) => ({
          time: `${index.toString().padStart(2, '0')}:00`,
          hour: index,
          aqi: aqi,
          pm25: demoHourlyData.pm2_5[index],
          pm10: demoHourlyData.pm10[index],
          no2: demoHourlyData.nitrogen_dioxide[index],
          o3: demoHourlyData.ozone[index],
          so2: demoHourlyData.sulphur_dioxide[index],
          co: demoHourlyData.carbon_monoxide[index],
        })),
        pollutants: [
          { name: 'PM2.5', value: demoHourlyData.pm2_5[currentIndex], unit: 'μg/m³', color: '#2d1b69' },
          { name: 'PM10', value: demoHourlyData.pm10[currentIndex], unit: 'μg/m³', color: '#7c2d12' },
          { name: 'NO₂', value: demoHourlyData.nitrogen_dioxide[currentIndex], unit: 'μg/m³', color: '#a16207' },
          { name: 'O₃', value: demoHourlyData.ozone[currentIndex], unit: 'μg/m³', color: '#166534' },
          { name: 'SO₂', value: demoHourlyData.sulphur_dioxide[currentIndex], unit: 'μg/m³', color: '#1e3a8a' },
          { name: 'CO', value: demoHourlyData.carbon_monoxide[currentIndex], unit: 'μg/m³', color: '#991b1b' },
        ]
      };
      
      setAirQualityData(fallbackData);
      setLastFetchedCoordinates({ lat, lon });
      setHasInitialLoad(true);
    } finally {
      setDataLoading(false);
    }
  }, [lastFetchedCoordinates, airQualityData]);

  // AQI değerine göre durum belirle
  const getAQIStatus = (aqi: number): string => {
    if (aqi <= 20) return 'Çok İyi';
    if (aqi <= 40) return 'İyi';
    if (aqi <= 60) return 'Orta';
    if (aqi <= 80) return 'Kötü';
    if (aqi <= 100) return 'Çok Kötü';
    return 'Tehlikeli';
  };

  // AQI rengini belirle
  const getAQIColor = (aqi: number): string => {
    if (aqi <= 20) return '#059669';
    if (aqi <= 40) return '#d97706';
    if (aqi <= 60) return '#dc2626';
    if (aqi <= 80) return '#b91c1c';
    if (aqi <= 100) return '#7c2d12';
    return '#450a0a';
  };

  // Ana kirleticiyi belirle
  const getMainPollutant = (current: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    co: number;
  }): {name: string, value: number, unit: string, threshold: number} => {
    const pollutants = [
      { name: 'PM2.5', value: current.pm25, unit: 'μg/m³', threshold: 15 }, // WHO günlük limit
      { name: 'PM10', value: current.pm10, unit: 'μg/m³', threshold: 45 }, // WHO günlük limit
      { name: 'NO₂', value: current.no2, unit: 'μg/m³', threshold: 25 }, // WHO günlük limit (daha düşük)
      { name: 'O₃', value: current.o3, unit: 'μg/m³', threshold: 60 }, // EU saatlik hedef (düşürüldü)
      { name: 'SO₂', value: current.so2, unit: 'μg/m³', threshold: 40 }, // WHO günlük limit
      { name: 'CO', value: current.co, unit: 'μg/m³', threshold: 4000 }, // WHO 8-saatlik ortalama (mg/m³ → μg/m³)
    ];

    // Threshold'u aşan en yüksek orantılı kirleticiyi bul
    const exceedingPollutants = pollutants.filter(p => p.value > p.threshold);
    if (exceedingPollutants.length > 0) {
      const highest = exceedingPollutants.reduce((prev, current) => 
        (current.value / current.threshold) > (prev.value / prev.threshold) ? current : prev
      );
      return highest;
    }

    // Hiçbiri threshold'u aşmıyorsa en yüksek orantıya sahip olanı döndür
    return pollutants.reduce((prev, current) => 
      (current.value / current.threshold) > (prev.value / prev.threshold) ? current : prev
    );
  };

  // Kirletici durum açıklaması
  const getPollutantStatus = (pollutant: {name: string, value: number, threshold: number}): string => {
    const ratio = pollutant.value / pollutant.threshold;
    if (ratio <= 0.5) return 'Çok İyi';
    if (ratio <= 0.8) return 'İyi';
    if (ratio <= 1.0) return 'Orta';
    if (ratio <= 1.5) return 'Kötü';
    return 'Çok Kötü';
  };

  // Korelasyon hesaplama fonksiyonu
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Bireysel kirletici AQI hesaplama
  const calculateIndividualAQI = (pollutant: string, value: number): number => {
    const breakpoints: Record<string, {values: number[], aqi: number[]}> = {
      'PM2.5': {
        values: [0, 15, 25, 35, 65, 150],
        aqi: [0, 20, 40, 60, 80, 100]
      },
      'PM10': {
        values: [0, 25, 50, 90, 180, 350],
        aqi: [0, 20, 40, 60, 80, 100]
      },
      'NO₂': {
        values: [0, 25, 45, 90, 180, 400],
        aqi: [0, 20, 40, 60, 80, 100]
      },
      'O₃': {
        values: [0, 60, 120, 180, 240, 600],
        aqi: [0, 20, 40, 60, 80, 100]
      },
      'SO₂': {
        values: [0, 40, 80, 120, 230, 500],
        aqi: [0, 20, 40, 60, 80, 100]
      },
      'CO': {
        values: [0, 4000, 8000, 12000, 16000, 30000],
        aqi: [0, 20, 40, 60, 80, 100]
      }
    };

    const bp = breakpoints[pollutant];
    if (!bp) return 0;

    // Uygun aralığı bul
    let i = 0;
    while (i < bp.values.length - 1 && value > bp.values[i + 1]) {
      i++;
    }

    if (i >= bp.values.length - 1) return bp.aqi[bp.aqi.length - 1];

    // Linear interpolation
    const valueLow = bp.values[i];
    const valueHigh = bp.values[i + 1];
    const aqiLow = bp.aqi[i];
    const aqiHigh = bp.aqi[i + 1];

    return Math.round(((aqiHigh - aqiLow) / (valueHigh - valueLow)) * (value - valueLow) + aqiLow);
  };

  // En kirli ve temiz saatleri bulma
  const getExtremeHours = (hourlyData: {aqi: number; time?: string}[]) => {
    if (!hourlyData || hourlyData.length === 0) return { cleanest: null, dirtiest: null };

    const cleanest = hourlyData.reduce((min, hour, index) => 
      hour.aqi < hourlyData[min].aqi ? index : min, 0
    );
    
    const dirtiest = hourlyData.reduce((max, hour, index) => 
      hour.aqi > hourlyData[max].aqi ? index : max, 0
    );

    return {
      cleanest: { hour: cleanest, aqi: hourlyData[cleanest].aqi, time: hourlyData[cleanest].time },
      dirtiest: { hour: dirtiest, aqi: hourlyData[dirtiest].aqi, time: hourlyData[dirtiest].time }
    };
  };

  // Aktivite önerileri hesaplama
  const getActivityRecommendations = (hourlyData: {aqi: number}[]) => {
    if (!hourlyData || hourlyData.length === 0) return {
      sports: [],
      children: [],
      walking: [],
      current: { hour: 0, aqi: 0, recommendation: 'Veri yok' }
    };

    const currentHour = new Date().getHours();

    // Spor aktiviteleri için ideal saatler (AQI < 50)
    const sportsHours = hourlyData
      .map((hour, index) => ({ ...hour, hour: index }))
      .filter(hour => hour.aqi < 50)
      .slice(0, 6);

    // Çocuk aktiviteleri için ideal saatler (AQI < 40)
    const childrenHours = hourlyData
      .map((hour, index) => ({ ...hour, hour: index }))
      .filter(hour => hour.aqi < 40)
      .slice(0, 4);

    // Yürüyüş için ideal saatler (AQI < 60)
    const walkingHours = hourlyData
      .map((hour, index) => ({ ...hour, hour: index }))
      .filter(hour => hour.aqi < 60)
      .slice(0, 8);

    return {
      sports: sportsHours,
      children: childrenHours,
      walking: walkingHours,
      current: {
        hour: currentHour,
        aqi: hourlyData[currentHour]?.aqi || 0,
        recommendation: hourlyData[currentHour]?.aqi < 40 ? 'Güvenli' : 
                      hourlyData[currentHour]?.aqi < 60 ? 'Dikkatli' : 'Kaçının'
      }
    };
  };

  // Şehir karşılaştırması için API'den veri çekme
  const fetchCityComparisons = useCallback(async (currentAQI: number) => {
    const cities = [
      { name: 'Mevcut Konum', lat: null, lon: null, aqi: currentAQI, current: true },
      { name: 'Ankara', lat: 39.9334, lon: 32.8597, aqi: 0, current: false },
      { name: 'İzmir', lat: 38.4237, lon: 27.1428, aqi: 0, current: false },
      { name: 'Bursa', lat: 40.1826, lon: 29.0665, aqi: 0, current: false },
      { name: 'London', lat: 51.5074, lon: -0.1278, aqi: 0, current: false },
      { name: 'Paris', lat: 48.8566, lon: 2.3522, aqi: 0, current: false },
      { name: 'Berlin', lat: 52.5200, lon: 13.4050, aqi: 0, current: false },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, aqi: 0, current: false },
      { name: 'New York', lat: 40.7128, lon: -74.0060, aqi: 0, current: false },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, aqi: 0, current: false },
    ];

    try {
      // Mevcut konum dışındaki şehirler için API çağrısı
      const promises = cities
        .filter(city => !city.current)
        .map(async (city) => {
          try {
            const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=european_aqi&timezone=auto`;
            const response = await fetchWithRetry(url, 2); // Şehirler için 2 deneme yeterli
            const data = await response.json();
            return {
              ...city,
              aqi: data.current?.european_aqi || 0
            };
          } catch (error) {
            logger.warn(`Failed to fetch data for ${city.name}:`, error);
            // API başarısız olan şehirleri listeden çıkar - statik veri kullanma!
            return null;
          }
        });

      const updatedCities = await Promise.all(promises);
      
      // null değerleri filtrele (API başarısız olan şehirler)
      const validCities = updatedCities.filter((city): city is NonNullable<typeof city> => city !== null);
      
      // Mevcut konumu ekle
      const allCities = [
        cities.find(city => city.current)!,
        ...validCities
      ];

      return allCities
        .sort((a, b) => a.aqi - b.aqi)
        .map(city => ({
          ...city,
          color: getAQIColor(city.aqi)
        }));
    } catch (error) {
      criticalError('Şehir karşılaştırması API\'si tamamen başarısız:', error);
      // Sadece mevcut konum ile devam et - statik veri kullanma!
      return [
        { name: 'Mevcut Konum', lat: null, lon: null, aqi: currentAQI, current: true, color: getAQIColor(currentAQI) }
      ];
    }
  }, []);

  // Statik fallback sistemini tamamen kaldırdık - artık sadece dinamik API verisi!



  // Sadece ilk yüklemede veya sayfa yenilendiğinde veri çek
  useEffect(() => {
    if (permissionState === 'granted' && latitude && longitude && !hasInitialLoad) {
      // İlk yükleme - koordinatları cache'le ve veri çek
      fetchAirQualityData(latitude, longitude, true);
    }
  }, [permissionState, latitude, longitude, hasInitialLoad, fetchAirQualityData]);

  // Şehir karşılaştırma verilerini çek
  useEffect(() => {
    if (airQualityData?.current?.aqi) {
      setCityDataLoading(true);
      fetchCityComparisons(airQualityData.current.aqi)
        .then(setCityComparisons)
        .catch((error) => {
          logger.error('Şehir karşılaştırması başarısız - sadece mevcut konum gösterilecek:', error);
          // Statik veri kullanma! Sadece boş liste
          setCityComparisons([]);
        })
        .finally(() => setCityDataLoading(false));
    }
  }, [airQualityData, fetchCityComparisons]);

  // Initial scroll button state setup
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('hourly-scroll-container');
      if (container) {
        updateScrollButtons(container);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [airQualityData]);

  // Sayfa yenilenme durumunu kontrol et (localStorage ile)
  useEffect(() => {
    const checkPageRefresh = () => {
      const lastCoords = localStorage.getItem('nefes-last-coordinates');
      const sessionMarker = sessionStorage.getItem('nefes-session');
      
      if (!sessionMarker) {
        // Yeni session - sayfa yenilendi
        sessionStorage.setItem('nefes-session', 'active');
        if (lastCoords) {
          setLastFetchedCoordinates(null);
          setHasInitialLoad(false);
        }
      }
    };

    checkPageRefresh();
  }, []);

  // Koordinatları localStorage'a kaydet
  useEffect(() => {
    if (latitude && longitude) {
      localStorage.setItem('nefes-last-coordinates', JSON.stringify({ lat: latitude, lon: longitude }));
    }
  }, [latitude, longitude]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Always show map - it will update when real coordinates come in */}
      <Map 
        latitude={latitude || 40.9128} 
        longitude={longitude || 29.1244} 
        zoom={permissionState === 'granted' ? 15 : 10}
        className="h-full w-full"
        showUserLocation={permissionState === 'granted' && !!latitude && !!longitude}
      />
      
      {/* Floating Chart Container with Carousel */}
      <div className="floating-chart absolute h-[50vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="h-full p-3 md:p-4 flex flex-col">
          {/* API Status Warning */}
          {isUsingFallbackData && (
            <div className="flex-shrink-0 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Demo Veriler Gösteriliyor
                </span>
                {apiRetryCount > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    (Deneme {apiRetryCount + 1}/3)
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Gerçek zamanlı veriler yüklenemedi. Bu veriler demo amaçlıdır.
              </p>
            </div>
          )}
          
          {/* Chart header */}
          <div className="flex-shrink-0 mb-2 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Hava Kalitesi Verileri</h3>
            {dataLoading && (
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                <span className="animate-pulse">
                  Veri yükleniyor
                </span>
              </Badge>
            )}
          </div>
 
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick access tags */}
            <div className="flex-shrink-0 mb-2 relative">
              {/* Right fade effect */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none opacity-50"></div>
              
              {/* Scrollable badges container */}
              <div ref={badgeContainerRef} className="flex gap-1 overflow-x-auto scrollbar-hide pr-4 py-1">
                {carouselData.map((item, index) => (
                  <Badge
                    key={item.id}
                    variant={current === index + 1 ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-200 text-[10px] px-2 py-0.5 h-5 rounded-md font-medium flex-shrink-0"
                    onClick={() => handleTagClick(index)}
                  >
                    {item.title}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Carousel content area */}
            <div className="flex-1 min-h-0">
              <Carousel setApi={setApi} className="h-full">
                <CarouselContent className="h-full">
                  {carouselData.map((item, index) => (
                    <CarouselItem key={item.id} className="h-full">
                      <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-xl p-2 md:p-3">
                        {/* Chart content area - Mobile First */}
                        <div className="w-full h-full min-h-0">
                          {dataLoading || !airQualityData ? (
                            <>
                              {/* Genel Bakış - Overview Cards */}
                              {index === 0 && (
                                <div className="h-full flex flex-col gap-2">
                                  {/* Main Stats Row */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg flex flex-col justify-center">
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Şu Anki AQI</div>
                                      <Skeleton className="h-6 w-12 mb-1" />
                                      <Skeleton className="h-3 w-16" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg flex flex-col justify-center">
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ana Kirletici: --</div>
                                      <Skeleton className="h-6 w-12 mb-1" />
                                      <Skeleton className="h-3 w-16" />
                                    </div>
                                  </div>

                                  {/* Hourly Summary Skeleton */}
                                  <div className="bg-white dark:bg-gray-700 p-2 rounded-lg flex-1">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">24 Saatlik Özet</div>
                                      <Skeleton className="h-4 w-12" />
                                    </div>
                                    <div className="flex gap-1 overflow-hidden">
                                      {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex-shrink-0 bg-gray-50 dark:bg-gray-600 rounded-md p-1.5 min-w-[48px] flex flex-col items-center">
                                          <Skeleton className="h-2 w-8 mb-1" />
                                          <Skeleton className="h-3 w-6 mb-1" />
                                          <Skeleton className="h-2 w-full mb-0.5" />
                                          <Skeleton className="h-2 w-full mb-0.5" />
                                          <Skeleton className="h-2 w-full" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Radial Charts Skeleton */}
                                  <div className="bg-white dark:bg-gray-700 p-2 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 h-full">
                                      {/* AQI Radial Chart Skeleton */}
                                      <div className="flex flex-col items-center">
                                        <Skeleton className="h-3 w-16 mb-2" />
                                        <Skeleton className="h-20 w-20 rounded-full mb-2" />
                                        <Skeleton className="h-2 w-12" />
                                      </div>
                                      {/* PM2.5 Radial Chart Skeleton */}
                                      <div className="flex flex-col items-center">
                                        <Skeleton className="h-3 w-20 mb-2" />
                                        <Skeleton className="h-20 w-20 rounded-full mb-2" />
                                        <Skeleton className="h-2 w-14" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Hava Kalitesi - AQI Line Chart */}
                              {index === 1 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                                    24 Saatlik AQI Trendi
                                  </div>
                                  <div className="flex-1 min-h-0 flex items-center justify-center">
                                    <div className="w-full space-y-2">
                                      <Skeleton className="h-20 w-full" />
                                      <div className="flex justify-between">
                                        <Skeleton className="h-3 w-8" />
                                        <Skeleton className="h-3 w-8" />
                                        <Skeleton className="h-3 w-8" />
                                        <Skeleton className="h-3 w-8" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Kirleticiler - Pollutants Bar Chart */}
                              {index === 2 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <Skeleton className="h-20 w-full" />
                                    <div className="flex justify-between">
                                      <Skeleton className="h-3 w-12" />
                                      <Skeleton className="h-3 w-12" />
                                      <Skeleton className="h-3 w-12" />
                                      <Skeleton className="h-3 w-8" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Korelasyonlar Skeleton */}
                              {index === 3 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <div className="grid grid-cols-2 gap-1">
                                      {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                      ))}
                                    </div>
                                    <Skeleton className="h-20 w-full" />
                                    </div>
                                </div>
                              )}

                              {/* Zaman Analizi Skeleton */}
                              {index === 4 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Skeleton className="h-16 w-full" />
                                      <Skeleton className="h-16 w-full" />
                                    </div>
                                    <div className="grid grid-cols-8 gap-0.5">
                                      {Array.from({ length: 24 }).map((_, i) => (
                                        <Skeleton key={i} className="h-8 w-full" />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Bireysel AQI Skeleton */}
                              {index === 5 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                          <Skeleton className="h-3 w-8 mb-1" />
                                          <Skeleton className="h-14 w-14 rounded-full mb-1" />
                                          <Skeleton className="h-2 w-12" />
                                        </div>
                                      ))}
                                    </div>
                                    <Skeleton className="h-12 w-full" />
                                  </div>
                                </div>
                              )}

                              {/* Aktivite Önerileri Skeleton */}
                              {index === 6 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <Skeleton className="h-20 w-full" />
                                      <Skeleton className="h-20 w-full" />
                                      <Skeleton className="h-20 w-full" />
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                      {Array.from({ length: 8 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Şehir Karşılaştırması Skeleton */}
                              {index === 7 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    {Array.from({ length: 8 }).map((_, i) => (
                                      <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-8" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}


                            </>
                          ) : (
                              <>
                            {/* Genel Bakış - Overview Cards with Hourly Summary */}
                            {index === 0 && (
                              <div className="h-full flex flex-col gap-2">
                                {/* Main Stats Row */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg flex flex-col justify-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Şu Anki AQI</div>
                                    <div 
                                      className="text-xl md:text-2xl font-bold mb-1"
                                      style={{ color: getAQIColor(airQualityData.current.aqi) }}
                                    >
                                      {Math.round(airQualityData.current.aqi)}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {airQualityData.current.status}
                                    </div>
                                  </div>
                                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg flex flex-col justify-center">
                                    {(() => {
                                      const mainPollutant = getMainPollutant(airQualityData.current);
                                      const isExceeding = mainPollutant.value > mainPollutant.threshold;
                                      const status = getPollutantStatus(mainPollutant);
                                      
                                      return (
                                        <>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Ana Kirletici: {mainPollutant.name}
                                          </div>
                                          <div className={`text-xl md:text-2xl font-bold mb-1 ${isExceeding ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {Math.round(mainPollutant.value)}
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {status}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Hourly Summary Carousel */}
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg flex-1">
                                  <div className="flex justify-between items-center mb-2 px-1">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      24 Saatlik Özet
                                    </div>
                                    {(() => {
                                      const currentHour = new Date().getHours();
                                      const currentAQI = airQualityData.hourly?.[currentHour]?.aqi || airQualityData.current.aqi;
                                      const nextHourAQI = airQualityData.hourly?.[currentHour + 1]?.aqi;
                                      
                                      let badgeStyle = "";
                                      
                                      if (nextHourAQI > currentAQI) {
                                        // Kötüleşiyor - Kırmızı tonları
                                        badgeStyle = "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
                                      } else if (nextHourAQI < currentAQI) {
                                        // İyileşiyor - Yeşil tonları
                                        badgeStyle = "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
                                      } else {
                                        // Sabit - Mavi/gri tonları
                                        badgeStyle = "bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800";
                                      }
                                      
                                      return (
                                        <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 border ${badgeStyle}`}>
                                          {getAQIStatus(currentAQI)}
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <div className="relative h-full overflow-hidden">
                                    {/* Sol kaydırma butonu - sadece gerektiğinde göster */}
                                    {canScrollLeft && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={scrollHourlyLeft}
                                        className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 h-5 w-5 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md rounded-full transition-all duration-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                                      >
                                        <ChevronLeft className="h-3 w-3" />
                                      </Button>
                                    )}
                                    
                                    {/* Sağ kaydırma butonu - sadece gerektiğinde göster */}
                                    {canScrollRight && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={scrollHourlyRight}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-5 w-5 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md rounded-full transition-all duration-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </Button>
                                    )}

                                    {/* Scroll container */}
                                    <div 
                                      id="hourly-scroll-container"
                                      className="flex gap-2 overflow-x-auto pb-1 h-full scrollbar-hide pl-2 pr-7 scroll-smooth py-0.5"
                                      onScroll={(e) => {
                                        const target = e.target as HTMLElement;
                                        updateScrollButtons(target);
                                      }}
                                      onLoad={(e) => {
                                        const target = e.target as HTMLElement;
                                        updateScrollButtons(target);
                                      }}
                                    >
                                      {airQualityData.hourly?.slice(0, 16).map((hour, idx) => {
                                        const isCurrentHour = idx === new Date().getHours();
                                        return (
                                          <div 
                                            key={idx} 
                                            className={`flex-shrink-0 rounded-md p-1.5 min-w-[48px] flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-200 ${
                                              isCurrentHour 
                                                ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                : 'bg-gray-50 dark:bg-gray-600'
                                            }`}
                                            style={{
                                              boxShadow: isCurrentHour 
                                                ? '0 0 0 1px rgb(59 130 246)' // inline blue border + shadow
                                                : '0 1px 2px 0 rgb(0 0 0 / 0.05)' // default shadow
                                            }}
                                          >
                                            <div className={`text-[8px] mb-1 font-medium ${
                                              isCurrentHour 
                                                ? 'text-blue-600 dark:text-blue-400' 
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                              {isCurrentHour ? 'Şimdi' : `${hour.time.split(':')[0]}:00`}
                                            </div>
                                            <div 
                                              className="text-xs font-bold mb-1 px-1 py-0.5 rounded-sm"
                                              style={{ 
                                                color: getAQIColor(hour.aqi),
                                                backgroundColor: `${getAQIColor(hour.aqi)}20`
                                              }}
                                            >
                                              {Math.round(hour.aqi)}
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 w-full">
                                              <div className="flex justify-between w-full text-[7px] text-gray-600 dark:text-gray-300">
                                                <span>PM2.5</span>
                                                <span className="font-medium">{Math.round(hour.pm25)}</span>
                                              </div>
                                              <div className="flex justify-between w-full text-[7px] text-gray-600 dark:text-gray-300">
                                                <span>PM10</span>
                                                <span className="font-medium">{Math.round(hour.pm10)}</span>
                                              </div>
                                              <div className="flex justify-between w-full text-[7px] text-blue-600 dark:text-blue-400">
                                                <span>O₃</span>
                                                <span className="font-medium">{Math.round(hour.o3)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Radial Charts */}
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg">
                                  <div className="grid grid-cols-2 gap-2 h-full">
                                    {/* AQI Radial Chart */}
                                    <div className="flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">
                                        AQI Seviyesi
                                      </div>
                                      <div className="relative w-20 h-20">
                                        <ChartContainer
                                          config={{
                                            aqi: {
                                              label: "AQI",
                                              color: getAQIColor(airQualityData.current.aqi),
                                            },
                                          }}
                                          className="w-full h-full"
                                        >
                                          <RadialBarChart
                                            data={[{
                                              name: "AQI",
                                              value: airQualityData.current.aqi, // Gerçek yüzde değeri
                                              fill: getAQIColor(airQualityData.current.aqi)
                                            }]}
                                            startAngle={90}
                                            endAngle={-270}
                                            innerRadius="65%"
                                            outerRadius="85%"
                                          >
                                            <RadialBar dataKey="value" cornerRadius={3} />
                                          </RadialBarChart>
                                        </ChartContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                          <div 
                                            className="text-lg font-bold leading-none"
                                            style={{ color: getAQIColor(airQualityData.current.aqi) }}
                                          >
                                            {Math.round(airQualityData.current.aqi)}
                                          </div>
                                          <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            AQI
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-2 text-center font-medium">
                                        {airQualityData.current.status}
                                      </div>
                                    </div>

                                    {/* PM2.5 Günlük Ortalama Radial Chart */}
                                    <div className="flex flex-col items-center">
                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">
                                        Günlük Ort. PM2.5
                                      </div>
                                      <div className="relative w-20 h-20">
                                        {(() => {
                                          const avgPM25 = airQualityData.hourly?.reduce((sum, hour) => sum + hour.pm25, 0) / (airQualityData.hourly?.length || 1);
                                          const pm25Percentage = (avgPM25 / 75) * 100; // 0-75 μg/m³ arası scale (WHO'ya göre makul üst limit)
                                          const pm25Color = avgPM25 <= 15 ? '#059669' : avgPM25 <= 25 ? '#d97706' : avgPM25 <= 35 ? '#dc2626' : '#b91c1c';
                                          
                                          return (
                                            <>
                                              <ChartContainer
                                                config={{
                                                  pm25: {
                                                    label: "PM2.5",
                                                    color: pm25Color,
                                                  },
                                                }}
                                                className="w-full h-full"
                                              >
                                                <RadialBarChart
                                                  data={[{
                                                    name: "PM2.5",
                                                    value: Math.min(pm25Percentage, 100),
                                                    fill: pm25Color
                                                  }]}
                                                  startAngle={90}
                                                  endAngle={-270}
                                                  innerRadius="65%"
                                                  outerRadius="85%"
                                                >
                                                  <RadialBar dataKey="value" cornerRadius={3} />
                                                </RadialBarChart>
                                              </ChartContainer>
                                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div 
                                                  className="text-lg font-bold leading-none"
                                                  style={{ color: pm25Color }}
                                                >
                                                  {Math.round(avgPM25)}
                                                </div>
                                                <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                  μg/m³
                                                </div>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                      <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-2 text-center font-medium">
                                        {(() => {
                                          const avgPM25 = airQualityData.hourly?.reduce((sum, hour) => sum + hour.pm25, 0) / (airQualityData.hourly?.length || 1);
                                          return avgPM25 <= 15 ? 'Çok İyi' : avgPM25 <= 25 ? 'İyi' : avgPM25 <= 35 ? 'Orta' : 'Kötü';
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Enhanced Hava Kalitesi - AQI Dashboard */}
                            {index === 1 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                {/* AQI Trend Chart (üst 60%) */}
                                <div className="flex-[3] min-h-0 flex flex-col">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                                    24 Saatlik AQI Trendi
                                  </div>
                                  <div className="flex-1 min-h-0">
                                    {!airQualityData?.hourly || airQualityData.hourly.length === 0 ? (
                                      <div className="h-full flex items-center justify-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {!airQualityData ? 'Veri yok' : 'AQI verileri yükleniyor...'}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-full w-full">
                                        <ChartContainer
                                          config={{
                                            aqi: {
                                              label: "AQI",
                                              color: "hsl(var(--chart-1))",
                                            },
                                          }}
                                          className="h-full w-full"
                                        >
                                          <AreaChart 
                                            data={airQualityData.hourly} 
                                            margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                                          >
                                            <CartesianGrid vertical={false} />
                                            <XAxis 
                                              dataKey="time" 
                                              fontSize={8}
                                              tickLine={false}
                                              axisLine={false}
                                              tickMargin={8}
                                              interval="preserveStartEnd"
                                              tickFormatter={(value) => {
                                                // Güvenli string parsing
                                                if (typeof value === 'string' && value.includes(':')) {
                                                  return value.split(':')[0];
                                                }
                                                return value;
                                              }}
                                            />
                                            <YAxis 
                                              fontSize={8}
                                              tickLine={false}
                                              axisLine={false}
                                              width={25}
                                              domain={['dataMin - 5', 'dataMax + 5']}
                                              tickFormatter={(value) => Math.round(value).toString()}
                                            />
                                            <ChartTooltip 
                                              cursor={false}
                                              content={<ChartTooltipContent indicator="line" />}
                                              formatter={(value) => {
                                                const aqiValue = Number(value);
                                                const status = aqiValue <= 20 ? 'Çok İyi' : 
                                                              aqiValue <= 40 ? 'İyi' : 
                                                              aqiValue <= 60 ? 'Orta' : 
                                                              aqiValue <= 80 ? 'Kötü' : 'Çok Kötü';
                                                return [
                                                  `${aqiValue.toFixed(1)} AQI`,
                                                  `${status}`
                                                ];
                                              }}
                                              labelFormatter={(label) => `Saat: ${label}`}
                                            />
                                            <Area
                                              dataKey="aqi"
                                              type="natural"
                                              fill="hsl(var(--chart-1))"
                                              fillOpacity={0.4}
                                              stroke="hsl(var(--chart-1))"
                                              strokeWidth={2}
                                            />
                                          </AreaChart>
                                        </ChartContainer>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Compact Insights Grid (alt 40%) */}
                                <div className="flex-[2] grid grid-cols-2 gap-2">
                                  {/* A. PM Oranı Göstergesi */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 flex flex-col justify-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                      PM2.5/PM10 Oranı
                                    </div>
                                    {(() => {
                                      const currentHour = new Date().getHours();
                                      const pm25 = airQualityData.hourly?.[currentHour]?.pm25 || airQualityData.current.pm25;
                                      const pm10 = airQualityData.hourly?.[currentHour]?.pm10 || airQualityData.current.pm10;
                                      const ratio = ((pm25 / pm10) * 100);
                                      const isHealthy = ratio < 70; // WHO önerisi
                                      
                                      return (
                                        <>
                                          <div className={`text-lg font-bold ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                            {ratio.toFixed(0)}%
                                          </div>
                                          <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                            {isHealthy ? 'Normal' : 'Yüksek'}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* B. Günün Peak Saati */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 flex flex-col justify-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                      Günün En Kötü Saati
                                    </div>
                                    {(() => {
                                      const peakHour = airQualityData.hourly?.reduce((max, hour, idx) => 
                                        hour.aqi > (airQualityData.hourly[max]?.aqi || 0) ? idx : max, 0
                                      );
                                      const peakAQI = airQualityData.hourly?.[peakHour]?.aqi;
                                      
                                      return (
                                        <>
                                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                            {String(peakHour).padStart(2, '0')}:00
                                          </div>
                                          <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                            AQI: {Math.round(peakAQI)}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* C. NO₂ Trend */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 flex flex-col justify-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                      NO₂ Trend
                                    </div>
                                    {(() => {
                                      const currentHour = new Date().getHours();
                                      const currentNO2 = airQualityData.hourly?.[currentHour]?.no2 || 0;
                                      const nextHourNO2 = airQualityData.hourly?.[currentHour + 1]?.no2 || 0;
                                      const isIncreasing = nextHourNO2 > currentNO2;
                                      const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
                                      
                                      return (
                                        <>
                                          <div className={`text-lg font-bold ${isIncreasing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {isIncreasing ? '↗' : '↘'}
                                          </div>
                                          <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                            {isRushHour ? 'Trafik Saati' : isIncreasing ? 'Artıyor' : 'Azalıyor'}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* D. Hava Temizlik Skoru */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 flex flex-col justify-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                      Temizlik Skoru
                                    </div>
                                    {(() => {
                                      // 0-100 arası skor (düşük AQI = yüksek skor)
                                      const avgAQI = airQualityData.hourly?.reduce((sum, h) => sum + h.aqi, 0) / airQualityData.hourly?.length || 0;
                                      const cleanScore = Math.max(0, 100 - avgAQI);
                                      const scoreColor = cleanScore > 60 ? 'text-green-600 dark:text-green-400' : cleanScore > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                                      
                                      return (
                                        <>
                                          <div className={`text-lg font-bold ${scoreColor}`}>
                                            {Math.round(cleanScore)}
                                          </div>
                                          <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                            /100
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Kirleticiler - Pollutants Analysis */}
                            {index === 2 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                {/* Bar Chart - Mevcut Değerler */}
                                <div className="flex-shrink-0" style={{ height: '40%' }}>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    Anlık Kirletici Değerleri
                                  </div>
                                  <ChartContainer
                                    config={{
                                      value: {
                                        label: "Değer",
                                        color: "hsl(var(--chart-2))",
                                      },
                                    }}
                                    className="h-full w-full"
                                  >
                                    <BarChart data={airQualityData.pollutants} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                      <XAxis 
                                        dataKey="name" 
                                        fontSize={8}
                                        tickLine={false}
                                        axisLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={40}
                                      />
                                      <YAxis 
                                        fontSize={8}
                                        tickLine={false}
                                        axisLine={false}
                                        width={25}
                                      />
                                      <ChartTooltip 
                                        content={<ChartTooltipContent />}
                                        formatter={(value, name) => [
                                          `${Number(value).toFixed(1)} ${airQualityData.pollutants.find((p) => p.name === name)?.unit || ''}`,
                                          name
                                        ]}
                                      />
                                      <Bar 
                                        dataKey="value" 
                                        fill="hsl(var(--chart-2))"
                                        radius={[2, 2, 0, 0]}
                                      />
                                    </BarChart>
                                  </ChartContainer>
                                </div>

                                {/* Trend Analysis - Son 12 Saat */}
                                <div className="flex-shrink-0" style={{ height: '35%' }}>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    12 Saatlik Trend Analizi
                                  </div>
                                  {(() => {
                                    const last12Hours = airQualityData.hourly?.slice(-12) || [];
                                    const trendData = last12Hours.map((hour, index) => ({
                                      hour: index,
                                      time: new Date(hour.time).getHours() + ':00',
                                      PM25: hour.pm25,
                                      PM10: hour.pm10,
                                      NO2: hour.no2,
                                      O3: hour.o3,
                                      SO2: hour.so2,
                                      CO: hour.co / 100 // CO değerini küçültüyoruz görsellik için
                                    }));

                                    return (
                                      <ChartContainer
                                        config={{
                                          PM25: { label: "PM2.5", color: "#2d1b69" },
                                          PM10: { label: "PM10", color: "#7c2d12" },
                                          NO2: { label: "NO₂", color: "#a16207" },
                                          O3: { label: "O₃", color: "#166534" },
                                          SO2: { label: "SO₂", color: "#1e3a8a" },
                                          CO: { label: "CO (x100)", color: "#991b1b" }
                                        }}
                                        className="h-full w-full"
                                      >
                                        <LineChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                          <XAxis 
                                            dataKey="time" 
                                            fontSize={8}
                                            tickLine={false}
                                            axisLine={false}
                                          />
                                          <YAxis 
                                            fontSize={8}
                                            tickLine={false}
                                            axisLine={false}
                                            width={25}
                                          />
                                          <ChartTooltip 
                                            content={({ active, payload, label }) => {
                                              if (active && payload && payload.length) {
                                                return (
                                                  <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border text-xs">
                                                    <p className="font-medium">{label}</p>
                                                    {payload.map((entry, index) => (
                                                      <p key={index} style={{ color: entry.color }}>
                                                        {entry.dataKey === 'CO' ? 
                                                          `${entry.name}: ${(Number(entry.value) * 100).toFixed(0)} μg/m³` :
                                                          `${entry.name}: ${Number(entry.value).toFixed(1)} μg/m³`
                                                        }
                                                      </p>
                                                    ))}
                                                  </div>
                                                );
                                              }
                                              return null;
                                            }}
                                          />
                                          <Line type="monotone" dataKey="PM25" stroke="#2d1b69" strokeWidth={1.5} dot={false} />
                                          <Line type="monotone" dataKey="PM10" stroke="#7c2d12" strokeWidth={1.5} dot={false} />
                                          <Line type="monotone" dataKey="NO2" stroke="#a16207" strokeWidth={1.5} dot={false} />
                                          <Line type="monotone" dataKey="O3" stroke="#166534" strokeWidth={1.5} dot={false} />
                                          <Line type="monotone" dataKey="SO2" stroke="#1e3a8a" strokeWidth={1.5} dot={false} />
                                          <Line type="monotone" dataKey="CO" stroke="#991b1b" strokeWidth={1.5} dot={false} />
                                        </LineChart>
                                      </ChartContainer>
                                    );
                                  })()}
                                </div>

                                {/* Health Risk Matrix */}
                                <div className="flex-1 min-h-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    WHO Sağlık Risk Analizi
                                  </div>
                                  {(() => {
                                    const currentHour = new Date().getHours();
                                    const currentIndex = Math.min(currentHour, (airQualityData.hourly?.length || 1) - 1);
                                    const current = airQualityData.hourly?.[currentIndex] || airQualityData.current;
                                    
                                    const riskData = [
                                      { 
                                        name: 'PM2.5', 
                                        value: current.pm25, 
                                        whoLimit: 15, // WHO 24-saat ortalama
                                        color: '#2d1b69',
                                        unit: 'μg/m³'
                                      },
                                      { 
                                        name: 'PM10', 
                                        value: current.pm10, 
                                        whoLimit: 45, // WHO 24-saat ortalama
                                        color: '#7c2d12',
                                        unit: 'μg/m³'
                                      },
                                      { 
                                        name: 'NO₂', 
                                        value: current.no2, 
                                        whoLimit: 25, // WHO 24-saat ortalama
                                        color: '#a16207',
                                        unit: 'μg/m³'
                                      },
                                      { 
                                        name: 'O₃', 
                                        value: current.o3, 
                                        whoLimit: 100, // WHO 8-saat ortalama
                                        color: '#166534',
                                        unit: 'μg/m³'
                                      },
                                      { 
                                        name: 'SO₂', 
                                        value: current.so2, 
                                        whoLimit: 40, // WHO 24-saat ortalama
                                        color: '#1e3a8a',
                                        unit: 'μg/m³'
                                      },
                                      { 
                                        name: 'CO', 
                                        value: current.co, 
                                        whoLimit: 4000, // WHO 8-saat ortalama (mg/m³ → μg/m³)
                                        color: '#991b1b',
                                        unit: 'μg/m³'
                                      }
                                    ];

                                    return (
                                      <div className="grid grid-cols-2 gap-1 h-full">
                                        {riskData.map((pollutant) => {
                                          const riskRatio = pollutant.value / pollutant.whoLimit;
                                          const riskLevel = riskRatio <= 0.5 ? 'low' : riskRatio <= 1.0 ? 'moderate' : 'high';
                                          const riskColor = riskLevel === 'low' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                                           riskLevel === 'moderate' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                                                           'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                                          const textColor = riskLevel === 'low' ? 'text-green-700 dark:text-green-300' :
                                                           riskLevel === 'moderate' ? 'text-yellow-700 dark:text-yellow-300' :
                                                           'text-red-700 dark:text-red-300';
                                          const riskText = riskLevel === 'low' ? 'Güvenli' :
                                                          riskLevel === 'moderate' ? 'Dikkat' : 'Tehlikeli';

                                          return (
                                            <div key={pollutant.name} className={`${riskColor} rounded-lg p-1.5 border`}>
                                              <div className="text-[9px] text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                                                {pollutant.name}
                                              </div>
                                              <div className={`text-sm font-bold ${textColor} mb-0.5`}>
                                                {pollutant.value.toFixed(1)}
                                              </div>
                                              <div className="text-[8px] text-gray-500 dark:text-gray-400 mb-0.5">
                                                WHO: {pollutant.whoLimit} {pollutant.unit}
                                              </div>
                                              <div className={`text-[8px] font-medium ${textColor}`}>
                                                {riskText} ({(riskRatio * 100).toFixed(0)}%)
                                              </div>
                                              {/* Risk Bar */}
                                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                                                <div 
                                                  className={`h-1 rounded-full ${
                                                    riskLevel === 'low' ? 'bg-green-500' :
                                                    riskLevel === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                                                  }`}
                                                  style={{ width: `${Math.min(100, riskRatio * 100)}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Korelasyonlar - PM2.5 ile Diğer Kirleticiler Scatter Plot */}
                            {index === 3 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                {/* Korelasyon Katsayıları */}
                                <div className="flex-shrink-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                                    PM2.5 Korelasyonları
                                  </div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {(() => {
                                      const pm25Values = airQualityData.hourly?.map(h => h.pm25) || [];
                                      const correlations = [
                                        { name: 'PM10', value: calculateCorrelation(pm25Values, airQualityData.hourly?.map(h => h.pm10) || []), color: '#7c2d12' },
                                        { name: 'NO₂', value: calculateCorrelation(pm25Values, airQualityData.hourly?.map(h => h.no2) || []), color: '#a16207' },
                                        { name: 'O₃', value: calculateCorrelation(pm25Values, airQualityData.hourly?.map(h => h.o3) || []), color: '#166534' },
                                        { name: 'SO₂', value: calculateCorrelation(pm25Values, airQualityData.hourly?.map(h => h.so2) || []), color: '#1e3a8a' }
                                      ];
                                      
                                      return correlations.map((corr) => (
                                        <div key={corr.name} className="bg-gray-50 dark:bg-gray-600 rounded-md p-1.5 text-center">
                                          <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">{corr.name}</div>
                                          <div 
                                            className="text-sm font-bold"
                                            style={{ color: Math.abs(corr.value) > 0.5 ? corr.color : '#6b7280' }}
                                          >
                                            {corr.value >= 0 ? '+' : ''}{corr.value.toFixed(2)}
                                          </div>
                                          <div className="text-[8px] text-gray-500 dark:text-gray-400">
                                            {Math.abs(corr.value) > 0.7 ? 'Güçlü' : Math.abs(corr.value) > 0.5 ? 'Orta' : 'Zayıf'}
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>

                                {/* PM2.5 vs PM10 Scatter Plot */}
                                <div className="flex-1 min-h-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    PM2.5 vs PM10 İlişkisi
                                  </div>
                                <ChartContainer
                                  config={{
                                      pm25: { label: "PM2.5", color: "#2d1b69" },
                                      pm10: { label: "PM10", color: "#7c2d12" },
                                  }}
                                  className="h-full w-full"
                                >
                                    <ScatterChart 
                                      data={airQualityData.hourly?.map((h, idx) => ({ pm25: h.pm25, pm10: h.pm10, hour: idx })) || []}
                                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                    >
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="pm25" 
                                        name="PM2.5"
                                      fontSize={8}
                                      tickLine={false}
                                      axisLine={false}
                                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="pm10" 
                                        name="PM10"
                                      fontSize={8}
                                      tickLine={false}
                                      axisLine={false}
                                      width={25}
                                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                    />
                                    <ChartTooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border text-xs">
                                                <p className="font-medium">{data.hour}:00</p>
                                                <p style={{ color: '#2d1b69' }}>PM2.5: {data.pm25.toFixed(1)} μg/m³</p>
                                                <p style={{ color: '#7c2d12' }}>PM10: {data.pm10.toFixed(1)} μg/m³</p>
                                                <p className="text-gray-500">Oran: {((data.pm25 / data.pm10) * 100).toFixed(0)}%</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Scatter dataKey="pm10" fill="#2d1b69" />
                                    </ScatterChart>
                                </ChartContainer>
                                </div>
                              </div>
                            )}

                            {/* Zaman Analizi - En Kirli/Temiz Saatler + Trend */}
                            {index === 4 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                {/* Extreme Hours Cards */}
                                <div className="flex-shrink-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                                    Günün Saatleri Analizi
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(() => {
                                      const extremes = getExtremeHours(airQualityData.hourly || []);
                                      return (
                                        <>
                                          {/* En Temiz Saat */}
                                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                                            <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-1">En Temiz Saat</div>
                                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                              {extremes.cleanest?.time}
                                            </div>
                                            <div className="text-xs text-green-600 dark:text-green-400">
                                              AQI: {extremes.cleanest?.aqi.toFixed(0)}
                                            </div>
                                          </div>

                                          {/* En Kirli Saat */}
                                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-200 dark:border-red-800">
                                            <div className="text-[10px] text-red-600 dark:text-red-400 font-medium mb-1">En Kirli Saat</div>
                                            <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                              {extremes.dirtiest?.time}
                                            </div>
                                            <div className="text-xs text-red-600 dark:text-red-400">
                                              AQI: {extremes.dirtiest?.aqi.toFixed(0)}
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Saatlik Heat Map */}
                                <div className="flex-1 min-h-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    Kirletici Heat Map (24 Saat)
                                  </div>
                                  <div className="grid grid-cols-8 gap-0.5 h-full">
                                    {airQualityData.hourly?.slice(0, 24).map((hour, idx) => {
                                      // Normalize edilmiş AQI değeri (0-1 arası)
                                      const maxAQI = Math.max(...(airQualityData.hourly?.map(h => h.aqi) || [0]));
                                      const minAQI = Math.min(...(airQualityData.hourly?.map(h => h.aqi) || [0]));
                                      const normalized = (hour.aqi - minAQI) / (maxAQI - minAQI);
                                      
                                      // Heat map renk skalaları
                                      const intensity = Math.round(normalized * 5); // 0-5 arası
                                      const colorClasses = [
                                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                                        'bg-green-200 dark:bg-green-800/40 text-green-900 dark:text-green-100',
                                        'bg-yellow-200 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-100',
                                        'bg-orange-200 dark:bg-orange-800/40 text-orange-900 dark:text-orange-100',
                                        'bg-red-200 dark:bg-red-800/40 text-red-900 dark:text-red-100',
                                        'bg-red-300 dark:bg-red-700/50 text-red-900 dark:text-red-100'
                                      ];
                                      
                                      return (
                                        <div 
                                          key={idx}
                                          className={`rounded-sm p-1 text-center transition-all duration-200 hover:scale-110 cursor-pointer ${colorClasses[intensity]}`}
                                          title={`${hour.time}: AQI ${hour.aqi.toFixed(0)}`}
                                        >
                                          <div className="text-[8px] font-medium leading-none mb-0.5">
                                            {idx}
                                          </div>
                                          <div className="text-[7px] leading-none">
                                            {hour.aqi.toFixed(0)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Bireysel AQI - Her Kirletici için Ayrı AQI Hesaplaması */}
                            {index === 5 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                  Bireysel Kirletici AQI Değerleri
                                </div>
                                
                                {/* Individual AQI Radial Charts */}
                                <div className="grid grid-cols-3 gap-2 flex-1">
                                  {(() => {
                                    const currentHour = new Date().getHours();
                                    const currentIndex = Math.min(currentHour, (airQualityData.hourly?.length || 1) - 1);
                                    const current = airQualityData.hourly?.[currentIndex] || airQualityData.current;
                                    
                                    const pollutantData = [
                                      { name: 'PM2.5', value: current.pm25, color: '#2d1b69', unit: 'μg/m³' },
                                      { name: 'PM10', value: current.pm10, color: '#7c2d12', unit: 'μg/m³' },
                                      { name: 'NO₂', value: current.no2, color: '#a16207', unit: 'μg/m³' },
                                      { name: 'O₃', value: current.o3, color: '#166534', unit: 'μg/m³' },
                                      { name: 'SO₂', value: current.so2, color: '#1e3a8a', unit: 'μg/m³' },
                                      { name: 'CO', value: current.co, color: '#991b1b', unit: 'μg/m³' },
                                    ];
                                    
                                    return pollutantData.map((pollutant) => {
                                      const individualAQI = calculateIndividualAQI(pollutant.name, pollutant.value);
                                      
                                      return (
                                        <div key={pollutant.name} className="flex flex-col items-center bg-gray-50 dark:bg-gray-600 rounded-lg p-1.5">
                                          <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1 text-center font-medium">
                                            {pollutant.name}
                                          </div>
                                          <div className="relative w-14 h-14 mb-1">
                                            <ChartContainer
                                              config={{
                                                value: {
                                                  label: pollutant.name,
                                                  color: pollutant.color,
                                                },
                                              }}
                                              className="w-full h-full"
                                            >
                                              <RadialBarChart
                                                data={[{
                                                  name: pollutant.name,
                                                  value: individualAQI,
                                                  fill: pollutant.color
                                                }]}
                                                startAngle={90}
                                                endAngle={-270}
                                                innerRadius="60%"
                                                outerRadius="80%"
                                              >
                                                <RadialBar dataKey="value" cornerRadius={2} />
                                              </RadialBarChart>
                                            </ChartContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                              <div 
                                                className="text-xs font-bold leading-none"
                                                style={{ color: pollutant.color }}
                                              >
                                                {individualAQI}
                                              </div>
                                              <div className="text-[7px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                AQI
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-[8px] text-gray-600 dark:text-gray-400 text-center">
                                            {pollutant.value.toFixed(1)} {pollutant.unit}
                                          </div>
                                          <div className="text-[7px] text-gray-500 dark:text-gray-400 text-center">
                                            {getAQIStatus(individualAQI)}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                                
                                {/* AQI Comparison Bar */}
                                <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-600 rounded-lg p-2">
                                  <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">En Yüksek Bireysel AQI</div>
                                  {(() => {
                                    const currentHour = new Date().getHours();
                                    const currentIndex = Math.min(currentHour, (airQualityData.hourly?.length || 1) - 1);
                                    const current = airQualityData.hourly?.[currentIndex] || airQualityData.current;
                                    
                                    const individualAQIs = [
                                      { name: 'PM2.5', aqi: calculateIndividualAQI('PM2.5', current.pm25), color: '#2d1b69' },
                                      { name: 'PM10', aqi: calculateIndividualAQI('PM10', current.pm10), color: '#7c2d12' },
                                      { name: 'NO₂', aqi: calculateIndividualAQI('NO₂', current.no2), color: '#a16207' },
                                      { name: 'O₃', aqi: calculateIndividualAQI('O₃', current.o3), color: '#166534' },
                                      { name: 'SO₂', aqi: calculateIndividualAQI('SO₂', current.so2), color: '#1e3a8a' },
                                      { name: 'CO', aqi: calculateIndividualAQI('CO', current.co), color: '#991b1b' },
                                    ];
                                    
                                    const highest = individualAQIs.reduce((max, current) => 
                                      current.aqi > max.aqi ? current : max
                                    );
                                    
                                    return (
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="text-sm font-bold" style={{ color: highest.color }}>
                                            {highest.name}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                            AQI {highest.aqi}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                          Ana limit faktörü
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Aktivite Önerileri - Spor, Yürüyüş, Çocuk Aktiviteleri */}
                            {index === 6 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                {/* Ana Aktivite Kartları */}
                                <div className="flex-shrink-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                                    Şu Anki Durum ve Öneriler
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(() => {
                                      const recommendations = getActivityRecommendations(airQualityData.hourly || []);
                                      const currentAQI = recommendations.current?.aqi || 0;
                                      
                                      return [
                                        {
                                          title: 'Spor',
                                          icon: '🏃‍♂️',
                                          status: currentAQI < 50 ? 'Uygun' : currentAQI < 70 ? 'Dikkatli' : 'Uygun Değil',
                                          color: currentAQI < 50 ? 'green' : currentAQI < 70 ? 'yellow' : 'red',
                                          advice: currentAQI < 50 ? 'Koşu yapabilirsiniz' : currentAQI < 70 ? 'Hafif egzersiz' : 'İç mekan sporları'
                                        },
                                        {
                                          title: 'Yürüyüş',
                                          icon: '🚶‍♂️',
                                          status: currentAQI < 60 ? 'Uygun' : currentAQI < 80 ? 'Dikkatli' : 'Uygun Değil',
                                          color: currentAQI < 60 ? 'green' : currentAQI < 80 ? 'yellow' : 'red',
                                          advice: currentAQI < 60 ? 'Rahatça yürüyün' : currentAQI < 80 ? 'Kısa mesafe' : 'Kapalı alanlarda'
                                        },
                                        {
                                          title: 'Çocuklar',
                                          icon: '👶',
                                          status: currentAQI < 40 ? 'Güvenli' : currentAQI < 60 ? 'Dikkatli' : 'Risk',
                                          color: currentAQI < 40 ? 'green' : currentAQI < 60 ? 'yellow' : 'red',
                                          advice: currentAQI < 40 ? 'Dış oyunlar uygun' : currentAQI < 60 ? 'Kısa süreli' : 'İç mekan oyunları'
                                        }
                                      ].map((activity) => {
                                        const bgColor = activity.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                                       activity.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                                                       'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                                        const textColor = activity.color === 'green' ? 'text-green-700 dark:text-green-300' :
                                                         activity.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
                                                         'text-red-700 dark:text-red-300';
                                        
                                        return (
                                          <div key={activity.title} className={`rounded-lg p-2 border ${bgColor}`}>
                                            <div className="text-center mb-1">
                                              <div className="text-lg mb-1">{activity.icon}</div>
                                              <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                                {activity.title}
                                              </div>
                                            </div>
                                            <div className={`text-xs font-bold text-center ${textColor}`}>
                                              {activity.status}
                                            </div>
                                            <div className="text-[8px] text-gray-600 dark:text-gray-400 text-center mt-1">
                                              {activity.advice}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>

                                {/* İdeal Saatler Timeline */}
                                <div className="flex-1 min-h-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                    Günün İdeal Aktivite Saatleri
                                  </div>
                                  <div className="grid grid-cols-6 gap-1 h-full">
                                    {airQualityData.hourly?.slice(0, 24).map((hour, idx) => {
                                      const activityLevel = hour.aqi < 40 ? 'excellent' : 
                                                           hour.aqi < 50 ? 'good' : 
                                                           hour.aqi < 60 ? 'moderate' : 
                                                           hour.aqi < 70 ? 'poor' : 'bad';
                                      
                                      const colors = {
                                        excellent: 'bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200',
                                        good: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                                        moderate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
                                        poor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
                                        bad: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                      };

                                      const icons = {
                                        excellent: '🏃‍♂️',
                                        good: '🚶‍♂️',
                                        moderate: '🚶‍♀️',
                                        poor: '🏠',
                                        bad: '❌'
                                      };
                                      
                                      return (
                                        <div 
                                          key={idx}
                                          className={`rounded-sm p-1 text-center transition-all duration-200 hover:scale-105 cursor-pointer ${colors[activityLevel]}`}
                                          title={`${idx}:00 - AQI: ${hour.aqi.toFixed(0)} (${activityLevel})`}
                                        >
                                          <div className="text-[8px] font-medium leading-none mb-0.5">
                                            {idx < 10 ? `0${idx}` : idx}
                                          </div>
                                          <div className="text-[10px] mb-0.5">
                                            {icons[activityLevel]}
                                          </div>
                                          <div className="text-[7px] leading-none">
                                            {hour.aqi.toFixed(0)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Şehir Karşılaştırması - Horizontal Bar Chart */}
                            {index === 7 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2 flex flex-col gap-2">
                                <div className="flex-shrink-0">
                                  <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                                    Şehirler AQI Karşılaştırması
                                  </h3>
                                </div>
                                
                                <div className="flex-1 min-h-0 space-y-1.5">
                                  {cityDataLoading ? (
                                    // Loading skeleton
                                    Array.from({ length: 6 }).map((_, i) => (
                                      <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-16 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse h-3" />
                                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded h-5 animate-pulse" />
                                        <div className="w-6 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                                      </div>
                                    ))
                                  ) : (
                                    (() => {
                                      // Artık sadece gerçek API verilerini kullan - statik fallback yok!
                                      const cities = cityComparisons.length > 0 ? cityComparisons : [];
                                      
                                      if (cities.length === 0) {
                                        return (
                                          <div className="flex items-center justify-center h-full">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                              <div className="mb-1">🌐</div>
                                              <div>Şehir verileri yükleniyor...</div>
                                              <div className="text-[10px] mt-1">Gerçek API verisi bekleniyor</div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      const maxAQI = Math.max(...cities.map(city => city.aqi));
                                      
                                      return cities.slice(0, 8).map((city) => {
                                        const percentage = (city.aqi / maxAQI) * 100;
                                        
                                        return (
                                          <div key={city.name} className="flex items-center gap-1.5">
                                            {/* Şehir adı - sabit genişlik */}
                                            <div className="w-16 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                              {city.current && '• '}{city.name}
                                            </div>
                                            
                                            {/* Bar container */}
                                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded h-5 overflow-hidden">
                                              <div 
                                                className={`h-full transition-all duration-500 ease-out rounded ${
                                                  city.current 
                                                    ? 'bg-zinc-600 dark:bg-zinc-400' 
                                                    : 'bg-zinc-400 dark:bg-zinc-500'
                                                }`}
                                                style={{ width: `${Math.max(percentage, 8)}%` }}
                                              />
                                            </div>
                                            
                                            {/* AQI değeri */}
                                            <div className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 w-6 text-right">
                                              {Math.round(city.aqi)}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()
                                  )}
                                </div>

                                {/* Kompakt İstatistik */}
                                <div className="flex-shrink-0 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1">
                                  {(() => {
                                    const currentAQI = airQualityData.current?.aqi || 0;
                                    // Sadece gerçek API verilerini kullan
                                    const cities = cityComparisons.length > 0 ? cityComparisons : [];
                                    
                                    if (cities.length === 0) {
                                      return (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                          API verisi bekleniyor...
                                        </div>
                                      );
                                    }
                                    
                                    const currentCityIndex = cities.findIndex(city => city.current) + 1;
                                    const betterCities = cities.filter(city => !city.current && city.aqi < currentAQI).length;
                                    
                                    return (
                                      <>
                                        <div className="text-[10px]">
                                          <span className="text-zinc-500 dark:text-zinc-400">#{currentCityIndex}</span>
                                        </div>
                                        <div className="text-[10px]">
                                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {betterCities} şehir daha temiz
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}


                          </>
                        )}
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
