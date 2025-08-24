'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import Map from '@/components/Map';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

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
    // Sadece prompt veya denied durumlarında dialog göster
    // Unknown durumunda da dialog gösterme - çünkü bu ilk yükleme anını gösterir
    if (permissionState === 'prompt' || permissionState === 'denied') {
      setShowPermissionDialog(true);
    } else if (permissionState === 'granted') {
      setShowPermissionDialog(false);
    }
    // 'unknown' durumunda dialog'u açık bırakma - sistem determine edene kadar bekle
  }, [permissionState]);

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
    try {
      
      // Open Meteo Air Quality API çağrısı
      const response = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,european_aqi&forecast_days=1&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('API çağrısı başarısız');
      }
      
      const data = await response.json();

      
      // API verilerini kontrol et
      if (!data.hourly || !data.hourly.european_aqi || !data.hourly.time) {
        console.error('Invalid API response structure:', data);
        
        // Test için mock data oluştur
        const mockData = {
          current: {
            aqi: 50,
            status: 'Orta',
            pm25: 25.5,
            pm10: 35.2,
            no2: 20.1,
            o3: 45.3,
            so2: 8.7,
            co: 0.6,
          },
          hourly: Array.from({ length: 24 }, (_, i) => ({
            time: `${i.toString().padStart(2, '0')}:00`,
            aqi: 30 + Math.random() * 40, // 30-70 arası random AQI
            pm25: 20 + Math.random() * 20,
            pm10: 30 + Math.random() * 25,
            no2: 15 + Math.random() * 15,
            o3: 40 + Math.random() * 30,
            so2: 5 + Math.random() * 10,
            co: 0.3 + Math.random() * 0.5,
          })),
          pollutants: [
            { name: 'PM2.5', value: 25.5, unit: 'μg/m³', color: '#8884d8' },
            { name: 'PM10', value: 35.2, unit: 'μg/m³', color: '#82ca9d' },
            { name: 'NO₂', value: 20.1, unit: 'μg/m³', color: '#ffc658' },
            { name: 'O₃', value: 45.3, unit: 'μg/m³', color: '#ff7300' },
            { name: 'SO₂', value: 8.7, unit: 'μg/m³', color: '#0088fe' },
            { name: 'CO', value: 0.6, unit: 'mg/m³', color: '#8dd1e1' },
          ]
        };
        

        setAirQualityData(mockData);
        setLastFetchedCoordinates({ lat, lon });
        setHasInitialLoad(true);
        setDataLoading(false);
        return;
      }
      
      // Veriyi uygun formata çevir
      const processedData = {
        current: {
          aqi: data.hourly?.european_aqi?.[0] || 0,
          status: getAQIStatus(data.hourly?.european_aqi?.[0] || 0),
          pm25: data.hourly?.pm2_5?.[0] || 0,
          pm10: data.hourly?.pm10?.[0] || 0,
          no2: data.hourly?.nitrogen_dioxide?.[0] || 0,
          o3: data.hourly?.ozone?.[0] || 0,
          so2: data.hourly?.sulphur_dioxide?.[0] || 0,
          co: data.hourly?.carbon_monoxide?.[0] || 0,
        },
        hourly: data.hourly?.european_aqi?.slice(0, 24).map((aqi: number, index: number) => {
          const timeStr = data.hourly.time[index];
          const hour = timeStr ? new Date(timeStr).getHours() : index;
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          
          // AQI değerinin geçerli olduğundan emin ol
          const aqiValue = Number(aqi);
          const validAqi = isNaN(aqiValue) ? 0 : aqiValue;
          
          const hourlyData = {
            time: timeLabel,
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
          { name: 'PM2.5', value: data.hourly?.pm2_5?.[0] || 0, unit: 'μg/m³', color: '#8884d8' },
          { name: 'PM10', value: data.hourly?.pm10?.[0] || 0, unit: 'μg/m³', color: '#82ca9d' },
          { name: 'NO₂', value: data.hourly?.nitrogen_dioxide?.[0] || 0, unit: 'μg/m³', color: '#ffc658' },
          { name: 'O₃', value: data.hourly?.ozone?.[0] || 0, unit: 'μg/m³', color: '#ff7300' },
          { name: 'SO₂', value: data.hourly?.sulphur_dioxide?.[0] || 0, unit: 'μg/m³', color: '#0088fe' },
          { name: 'CO', value: data.hourly?.carbon_monoxide?.[0] || 0, unit: 'mg/m³', color: '#8dd1e1' },
        ]
      };
      

      
      setAirQualityData(processedData);
      setLastFetchedCoordinates({ lat, lon });
      setHasInitialLoad(true);
    } catch (error) {
      console.error('Error fetching air quality data:', error);
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
    if (aqi <= 20) return '#00e400';
    if (aqi <= 40) return '#ffff00';
    if (aqi <= 60) return '#ff7e00';
    if (aqi <= 80) return '#ff0000';
    if (aqi <= 100) return '#8f3f97';
    return '#7e0023';
  };

  // Sadece ilk yüklemede veya sayfa yenilendiğinde veri çek
  useEffect(() => {
    if (permissionState === 'granted' && latitude && longitude && !hasInitialLoad) {
      // İlk yükleme - koordinatları cache'le ve veri çek
      fetchAirQualityData(latitude, longitude, true);
    }
  }, [permissionState, latitude, longitude, hasInitialLoad, fetchAirQualityData]);

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
      <div className="floating-chart absolute h-[50vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="h-full p-3 md:p-4 flex flex-col">
          {/* Chart header */}
          <div className="flex-shrink-0 mb-2 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Hava Kalitesi Verileri</h3>
            {(loading || dataLoading) && (
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                <span className="animate-pulse">
                  {loading ? 'Konum yükleniyor' : 'Veri yükleniyor'}
                </span>
              </Badge>
            )}
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
                    className="cursor-pointer transition-all duration-200 text-xs px-2.5 py-1"
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
                          {dataLoading ? (
                            <div className="bg-white dark:bg-gray-700 rounded-lg h-full flex items-center justify-center p-4">
                              <div className="animate-pulse text-center">
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-24 mx-auto"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto"></div>
                              </div>
                            </div>
                          ) : !airQualityData ? (
                            <div className="bg-white dark:bg-gray-700 rounded-lg h-full flex items-center justify-center p-4">
                              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                {permissionState === 'granted' && latitude && longitude 
                                  ? 'Veri yükleniyor...' 
                                  : 'Konum izni gerekli'}
                              </div>
                            </div>
                          ) : (
                              <>
                            {/* Genel Bakış - Overview Cards */}
                            {index === 0 && (
                              <div className="h-full flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg flex flex-col justify-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AQI</div>
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
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ana Kirletici</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                      PM2.5
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {Math.round(airQualityData.current.pm25)} μg/m³
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">AQI Seviyesi</div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                    <div
                                      className="h-3 rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(airQualityData.current.aqi, 100)}%`,
                                        backgroundColor: getAQIColor(airQualityData.current.aqi)
                                      }}
                                    ></div>
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
                                        <LineChart 
                                          data={airQualityData.hourly} 
                                          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                                        >
                                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                          <XAxis 
                                            dataKey="time" 
                                            fontSize={8}
                                            tickLine={false}
                                            axisLine={false}
                                            angle={-45}
                                            textAnchor="end"
                                            height={40}
                                            interval="preserveStartEnd"
                                            tickFormatter={(value) => value.split(':')[0]}
                                          />
                                          <YAxis 
                                            fontSize={8}
                                            tickLine={false}
                                            axisLine={false}
                                            width={25}
                                          />
                                                                                      <ChartTooltip 
                                              content={<ChartTooltipContent />}
                                              formatter={(value) => [Number(value).toFixed(1), 'AQI']}
                                              labelFormatter={(label) => `Saat: ${label}`}
                                            />
                                          <Line 
                                            type="monotone" 
                                            dataKey="aqi" 
                                            stroke="hsl(var(--chart-1))" 
                                            strokeWidth={2}
                                            dot={{ fill: "hsl(var(--chart-1))", r: 2 }}
                                            activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                                          />
                                        </LineChart>
                                      </ChartContainer>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Kirleticiler - Pollutants Bar Chart */}
                            {index === 2 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
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
                            )}

                            {/* Tahmin - PM2.5 & PM10 Area Chart */}
                            {index === 3 && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg h-full p-2">
                                <ChartContainer
                                  config={{
                                    pm25: {
                                      label: "PM2.5",
                                      color: "hsl(var(--chart-3))",
                                    },
                                    pm10: {
                                      label: "PM10",
                                      color: "hsl(var(--chart-4))",
                                    },
                                  }}
                                  className="h-full w-full"
                                >
                                  <AreaChart data={airQualityData.hourly} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis 
                                      dataKey="time" 
                                      fontSize={8}
                                      tickLine={false}
                                      axisLine={false}
                                      interval="preserveStartEnd"
                                      tickFormatter={(value) => value.split(':')[0]}
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
                                        `${Number(value).toFixed(1)} μg/m³`,
                                        name
                                      ]}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="pm10"
                                      stackId="1"
                                      stroke="hsl(var(--chart-4))"
                                      fill="hsl(var(--chart-4))"
                                      fillOpacity={0.6}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="pm25"
                                      stackId="1"
                                      stroke="hsl(var(--chart-3))"
                                      fill="hsl(var(--chart-3))"
                                      fillOpacity={0.8}
                                    />
                                  </AreaChart>
                                </ChartContainer>
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
