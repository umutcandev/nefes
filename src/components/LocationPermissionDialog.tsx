'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Loader2, AlertTriangle, Info } from 'lucide-react';

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestPermission: () => void;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  error: string | null;
  loading: boolean;
}

export default function LocationPermissionDialog({
  open,
  onOpenChange,
  onRequestPermission,
  permissionState,
  error,
  loading
}: LocationPermissionDialogProps) {

  const handleAllowClick = () => {
    if (!loading) {
      onRequestPermission();
    }
  };

  const handleDenyClick = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 font-sans border-none" showCloseButton={false}>
        <DialogHeader className="text-center pt-6 pb-0 px-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center shrink-0">
              {permissionState === 'denied' ? (
                <AlertTriangle className="h-7 w-7 text-destructive" />
              ) : loading ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <MapPin className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-tight tracking-tight text-center">
            {loading 
              ? 'Konum Alınıyor...' 
              : permissionState === 'denied'
              ? 'Konum İzni Gerekli'
              : 'Konum İzniniz Gerekiyor'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed mx-auto text-center">
            {loading
              ? 'Konumunuzu belirlemek için bekleyin. Bu işlem birkaç saniye sürebilir.'
              : permissionState === 'denied'
              ? 'Hava kalitesi verilerini gösterebilmek için konumunuza ihtiyacımız var. Lütfen tarayıcı ayarlarından konum iznini etkinleştirin.'
              : 'Size en yakın hava kalitesi istasyonunu bulabilmemiz için konumunuza erişim izni vermeniz gerekiyor.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive" className="py-2.5 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs leading-relaxed font-medium">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="px-6 pt-4">
            <Alert variant="default" className="py-3 text-left shadow-none border-dashed">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <AlertTitle className="font-semibold mb-1.5 text-foreground text-sm">
                Konum İzni Nasıl Etkinleştirilir?
              </AlertTitle>
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                  <li>Tarayıcınızın adres çubuğundaki kilit (🔒) simgesine tıklayın.</li>
                  <li>&quot;Konum&quot; ayarını bulun ve &quot;İzin ver&quot; olarak değiştirin.</li>
                  <li>Değişikliklerin etkili olması için sayfayı yenileyin.</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="px-6 pt-5 pb-6 grid gap-2.5">
          {permissionState !== 'denied' && (
            <Button 
              onClick={handleAllowClick}
              disabled={loading}
              className="w-full h-10 text-sm font-semibold transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lütfen Bekleyin
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Konum İzni Ver
                </>
              )}
            </Button>
          )}
          <Button 
            variant={permissionState === 'denied' ? 'default' : 'outline'}
            onClick={handleDenyClick}
            className="w-full h-10 text-sm font-semibold"
          >
            {permissionState === 'denied' ? 'Anladım, Kapat' : 'Şimdi Değil'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
