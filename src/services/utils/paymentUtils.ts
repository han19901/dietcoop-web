import { Diyetisyen } from '@/types/diyetisyen';
import { Odeme } from '@/types/payment';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

export function calculatePaymentAmount(
  danisanSayisi: number,
  danisanBasiUcret: number,
  iskontoOrani: number,
  kdvOrani: number = 20
): { tutar: number; kdv: number; toplam: number; iskontoTutari: number } {
  // İskonto hesaplama: Danışan başına indirim = danışan başına ücret * iskonto oranı
  const danisanBasiIndirim = danisanBasiUcret * (iskontoOrani / 100);
  const iskontoTutari = danisanBasiIndirim * danisanSayisi;
  
  // İskonto sonrası tutar = (danışan başına ücret - danışan başına indirim) * danışan sayısı
  const tutar = (danisanBasiUcret - danisanBasiIndirim) * danisanSayisi;
  
  // KDV hesaplama: İskonto sonrası tutar üzerinden
  const kdv = tutar * (kdvOrani / 100);
  
  // Toplam tutar
  const toplam = tutar + kdv;

  return {
    tutar: Math.round(tutar * 100) / 100,
    kdv: Math.round(kdv * 100) / 100,
    toplam: Math.round(toplam * 100) / 100,
    iskontoTutari: Math.round(iskontoTutari * 100) / 100,
  };
}

export function generatePaymentDescription(
  uyeNumarasi: string,
  adSoyad: string
): string {
  return `${uyeNumarasi} ${adSoyad} DietCoop Üyelik Ücreti`;
}

export function createPayment(
  diyetisyen: Diyetisyen,
  gunSayisi: number = 30,
  kdvOrani: number = 20
): Omit<Odeme, 'id'> & { kdvOrani: number; iskontoTutari: number } {
  const now = new Date();
  const donemBaslangic = Timestamp.fromDate(now);
  const donemBitis = Timestamp.fromDate(addDays(now, gunSayisi));

  const { tutar, toplam, iskontoTutari } = calculatePaymentAmount(
    diyetisyen.aktifDanisanSayisi,
    diyetisyen.danisanBasiUcret,
    diyetisyen.iskontoOrani,
    kdvOrani
  );

  return {
    diyetisyenId: diyetisyen.id!,
    diyetisyenEmail: diyetisyen.email,
    diyetisyenAdSoyad: diyetisyen.adSoyad,
    uyeNumarasi: diyetisyen.uyeNumarasi,
    tutar,
    kdvOrani: kdvOrani,
    toplamTutar: toplam,
    odemeYontemi: 'bankaHavalesi',
    odemeDurumu: 'beklemede',
    donemBaslangic,
    donemBitis,
    gunSayisi,
    danisanSayisi: diyetisyen.aktifDanisanSayisi,
    olusturmaTarihi: Timestamp.now(),
    iskontoTutari,
  };
}

export function getNextPaymentDate(currentDate: Date, gunSayisi: number = 30): Date {
  return addDays(currentDate, gunSayisi);
}


