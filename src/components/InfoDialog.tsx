import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InfoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function InfoDialog({ isOpen, onOpenChange }: InfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Hava Kalitesi Parametreleri</DialogTitle>
          <DialogDescription>
            Her parametre hakkında detaylı bilgi için ilgili sekmesine tıklayın.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="pm25" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max h-10 items-center justify-start p-1 text-muted-foreground">
              <TabsTrigger value="pm25" className="whitespace-nowrap">PM2.5</TabsTrigger>
              <TabsTrigger value="pm10" className="whitespace-nowrap">PM10</TabsTrigger>
              <TabsTrigger value="o3" className="whitespace-nowrap">O3</TabsTrigger>
              <TabsTrigger value="no2" className="whitespace-nowrap">NO2</TabsTrigger>
              <TabsTrigger value="so2" className="whitespace-nowrap">SO2</TabsTrigger>
              <TabsTrigger value="co" className="whitespace-nowrap">CO</TabsTrigger>
              <TabsTrigger value="aqi" className="whitespace-nowrap">AQI</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <ScrollArea className="h-[300px] -mt-2 -ml-4">
            <TabsContent value="pm25" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">PM2.5 (Particulate Matter 2.5)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    2.5 mikrometreden küçük partiküler madde. İnsan saçının kalınlığının yaklaşık 30&apos;da 1&apos;i kadar küçüktür.
                    Bu partiküller o kadar küçüktür ki akciğer alveollerine ve kan dolaşımına kadar nüfuz edebilir.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Kalp hastalıkları ve felç riski</li>
                    <li>• Akciğer kanseri</li>
                    <li>• Kronik obstrüktif akciğer hastalığı (KOAH)</li>
                    <li>• Astım ve bronşit</li>
                    <li>• Erken ölüm riski</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Kaynakları</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Araç egzozları, sanayi emisyonları, orman yangınları, sigara dumanı, pişirme aktiviteleri
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">WHO Sınır Değerleri</h4>
                  <ul className="text-sm text-red-700 space-y-2 leading-relaxed">
                    <li>• Yıllık ortalama: 5 μg/m³</li>
                    <li>• Günlük ortalama: 15 μg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pm10" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">PM10 (Particulate Matter 10)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    10 mikrometreden küçük partiküler madde. PM2.5&apos;ten daha büyük ancak yine de solunum yollarına nüfuz edebilecek kadar küçük partiküller.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Solunum yolu tahrişi</li>
                    <li>• Astım ataklarının tetiklenmesi</li>
                    <li>• Öksürük ve nefes darlığı</li>
                    <li>• Göz ve boğaz tahrişi</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Kaynakları</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Toz fırtınaları, polen, inşaat aktiviteleri, yol tozu, deniz tuzu
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">WHO Sınır Değerleri</h4>
                  <ul className="text-sm text-orange-700 space-y-2 leading-relaxed">
                    <li>• Yıllık ortalama: 15 μg/m³</li>
                    <li>• Günlük ortalama: 45 μg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="o3" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">O3 (Ozon)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Yer seviyesindeki ozon, güneş ışığının azot oksitler ve uçucu organik bileşiklerle etkileşimi sonucu oluşur.
                    Stratosferik ozondan farklı olarak, yer seviyesindeki ozon zararlıdır.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Solunum yolu iltihabı</li>
                    <li>• Akciğer fonksiyon kaybı</li>
                    <li>• Astım semptomlarının kötüleşmesi</li>
                    <li>• Göğüs ağrısı ve öksürük</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Özellikler</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Özellikle sıcak, güneşli günlerde öğleden sonra konsantrasyonu artar. Yaz aylarında daha yüksek seviyelere ulaşır.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">EU Hedef Değeri</h4>
                  <ul className="text-sm text-yellow-700 space-y-2 leading-relaxed">
                    <li>• 8 saatlik ortalama: 120 μg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="no2" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">NO2 (Azot Dioksit)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Kahverengi, keskin kokulu gaz. Öncelikle fosil yakıt yanması sırasında oluşur.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Solunum yolu enfeksiyonları</li>
                    <li>• Astım ataklarının tetiklenmesi</li>
                    <li>• Çocuklarda akciğer gelişim bozukluğu</li>
                    <li>• Bronşit riski artışı</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Ana Kaynakları</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Araç egzozları (özellikle dizel), termik santraller, sanayi tesisleri
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">EU Sınır Değeri</h4>
                  <ul className="text-sm text-red-700 space-y-2 leading-relaxed">
                    <li>• Yıllık ortalama: 40 μg/m³</li>
                    <li>• Saatlik ortalama: 200 μg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="so2" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SO2 (Kükürt Dioksit)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Renksiz, keskin kokulu gaz. Kükürt içeren fosil yakıtların yanması sonucu oluşur.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Solunum yolu tahrişi</li>
                    <li>• Astım hastalarında bronkokonstrüksiyon</li>
                    <li>• Göz ve boğaz yanması</li>
                    <li>• Öksürük ve nefes darlığı</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Çevresel Etkiler</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Asit yağmurlarının ana nedenidir. Binaları, anıtları ve ormanları tahrip eder.
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">EU Sınır Değeri</h4>
                  <ul className="text-sm text-purple-700 space-y-2 leading-relaxed">
                    <li>• 24 saatlik ortalama: 125 μg/m³</li>
                    <li>• Saatlik ortalama: 350 μg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="co" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CO (Karbon Monoksit)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Renksiz, kokusuz ve son derece zehirli gaz. &quot;Sessiz katil&quot; olarak da bilinir.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nasıl Etki Eder?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Kanda hemoglobine bağlanarak oksijen taşınmasını engeller. Bu durum hücrelerin oksijen açlığı çekmesine neden olur.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Sağlık Etkileri</h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-6 leading-relaxed">
                    <li>• Baş ağrısı ve baş dönmesi</li>
                    <li>• Bulantı ve kusma</li>
                    <li>• Göğüs ağrısı</li>
                    <li>• Yüksek dozlarda bilinç kaybı ve ölüm</li>
                  </ul>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">EU Sınır Değeri</h4>
                  <ul className="text-sm text-red-700 space-y-2 leading-relaxed">
                    <li>• 8 saatlik ortalama: 10 mg/m³</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="aqi" className="space-y-6 p-6 pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">EAQI (European Air Quality Index)</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Nedir?</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Avrupa Hava Kalitesi İndeksi, tüm kirletici parametreleri tek bir değerde birleştiren standart ölçümdür.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">AQI Seviyeleri</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <div>
                        <span className="font-medium text-green-800">0-50: İyi</span>
                        <p className="text-xs text-green-700">Hava kalitesi tatmin edici, hassas gruplar için bile risk yok</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <div>
                        <span className="font-medium text-yellow-800">51-100: Orta</span>
                        <p className="text-xs text-yellow-700">Hassas kişiler için kabul edilebilir, genel popülasyon için problem yok</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <div>
                        <span className="font-medium text-orange-800">101-150: Hassas Gruplar İçin Sağlıksız</span>
                        <p className="text-xs text-orange-700">Hassas gruplar sağlık etkilerini hissedebilir</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-red-50 rounded">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <div>
                        <span className="font-medium text-red-800">151-200: Sağlıksız</span>
                        <p className="text-xs text-red-700">Herkes sağlık etkilerini hissedebilir, hassas gruplar daha ciddi etkiler</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <div>
                        <span className="font-medium text-purple-800">201-300: Çok Sağlıksız</span>
                        <p className="text-xs text-purple-700">Sağlık uyarısı: herkes ciddi sağlık etkileri yaşayabilir</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-4 h-4 bg-gray-800 rounded"></div>
                      <div>
                        <span className="font-medium text-gray-800">300+: Tehlikeli</span>
                        <p className="text-xs text-gray-700">Acil durum koşulları: tüm nüfus etkilenir</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Önlemler</h4>
                  <ul className="text-xs text-blue-700 space-y-2 leading-relaxed">
                    <li>• AQI 100+ olduğunda dış aktiviteleri sınırlayın</li>
                    <li>• Hassas gruplarsanız AQI 50+ bile dikkatli olun</li>
                    <li>• Yüksek AQI değerlerinde pencere ve kapıları kapatın</li>
                    <li>• Hava temizleyici kullanmayı düşünün</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
