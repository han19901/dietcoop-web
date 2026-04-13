import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { diyetisyenService } from '@/services/firebase/firestore';
import { evrakService } from '@/services/firebase/firestore';
import { bildirimService } from '@/services/firebase/bildirimService';
import { sendProfilGuncellemeBildirimi, sendEvrakYuklemeBildirimi } from '@/services/utils/bildirimUtils';

/**
 * Profil ve evrak kontrolü yapan hook
 * Diyetisyen giriş yaptığında veya sayfa yüklendiğinde kontrol yapar
 */
export function useBildirimKontrol() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid || user.rol !== 'diyetisyen') return;

    const kontrolEt = async () => {
      try {
        // Diyetisyen bilgilerini al
        const diyetisyen = await diyetisyenService.getByUserId(user.uid);
        if (!diyetisyen) return;

        // Profil kontrolü - TC Kimlik numarası eksikse bildirim gönder
        if (!diyetisyen.tcKimlikNo || diyetisyen.tcKimlikNo.length !== 11) {
          // Son 7 gün içinde profil güncelleme bildirimi gönderilmiş mi kontrol et
          const bildirimler = await bildirimService.getByDiyetisyenId(user.uid);
          const sonProfilBildirimi = bildirimler.find(
            (b) => b.tip === 'profilGuncelleme' && 
            b.olusturmaTarihi.toMillis() > Date.now() - 7 * 24 * 60 * 60 * 1000
          );

          if (!sonProfilBildirimi) {
            await sendProfilGuncellemeBildirimi(diyetisyen);
          }
        }

        // Evrak kontrolü - Zorunlu evraklar eksikse bildirim gönder
        const [mezuniyetBelgesi, tcKimlik] = await Promise.all([
          evrakService.evrakVarMi(user.uid, 'mezuniyetBelgesi'),
          evrakService.evrakVarMi(user.uid, 'tcKimlik'),
        ]);

        const mezuniyetEksik = !mezuniyetBelgesi || mezuniyetBelgesi.durum !== 'onaylandi';
        const tcKimlikEksik = !tcKimlik || tcKimlik.durum !== 'onaylandi';

        if (mezuniyetEksik || tcKimlikEksik) {
          // Son 7 gün içinde evrak yükleme bildirimi gönderilmiş mi kontrol et
          const bildirimler = await bildirimService.getByDiyetisyenId(user.uid);
          const sonEvrakBildirimi = bildirimler.find(
            (b) => b.tip === 'evrakYukleme' && 
            b.olusturmaTarihi.toMillis() > Date.now() - 7 * 24 * 60 * 60 * 1000
          );

          if (!sonEvrakBildirimi) {
            await sendEvrakYuklemeBildirimi(diyetisyen);
          }
        }
      } catch (error) {
        console.error('Bildirim kontrolü hatası:', error);
        // Hata olsa bile kullanıcıyı engelleme
      }
    };

    // İlk yüklemede kontrol et
    kontrolEt();

    // Her 24 saatte bir kontrol et
    const interval = setInterval(kontrolEt, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
