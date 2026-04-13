import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, FileText, Download, TrendingUp as ProfitIcon } from 'lucide-react';
import { faturaService, odemeService, giderService } from '@/services/firebase/firestore';
import { Fatura } from '@/types/fatura';
import { Odeme } from '@/types/payment';
import { Gider } from '@/types/gider';
import { useToast } from '@/context/ToastContext';

interface AylikDokum {
  yil: number;
  ay: number;
  ayAdi: string;
  toplamFatura: number;
  tahsilat: number;
  gider: number;
  kar: number;
  zarar: number;
  alacak: number;
  faturaSayisi: number;
  odemeSayisi: number;
  giderSayisi: number;
}

export default function Finans() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [aylikDokum, setAylikDokum] = useState<AylikDokum[]>([]);
  const [selectedYil, setSelectedYil] = useState<number>(new Date().getFullYear());
  const [selectedAy, setSelectedAy] = useState<number | 'all'>(new Date().getMonth() + 1);

  // Toplam istatistikler
  const [toplamGelir, setToplamGelir] = useState(0);
  const [toplamFatura, setToplamFatura] = useState(0);
  const [toplamAlacak, setToplamAlacak] = useState(0);
  const [toplamGider, setToplamGider] = useState(0);
  const [toplamKar, setToplamKar] = useState(0);
  const [toplamZarar, setToplamZarar] = useState(0);

  const ayIsimleri = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  useEffect(() => {
    loadData();
  }, [selectedYil, selectedAy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [faturalarData, odemelerData, giderlerData] = await Promise.all([
        faturaService.getAll(),
        odemeService.getAll(),
        giderService.getAll(),
      ]);


      // Filtreleme
      let filteredFaturalar = faturalarData;
      let filteredOdemeler = odemelerData;

      if (selectedYil) {
        filteredFaturalar = filteredFaturalar.filter(f => f.faturaDonemi.yil === selectedYil);
      }

      if (selectedAy !== 'all') {
        filteredFaturalar = filteredFaturalar.filter(f => f.faturaDonemi.ay === selectedAy);
      }

      // Onaylanan ödemeleri filtrele (gelir)
      const onaylananOdemeler = odemelerData.filter(o => o.odemeDurumu === 'onaylandi');
      
      // Yıl ve ay filtreleme için ödeme tarihine göre filtrele
      if (selectedYil) {
        filteredOdemeler = onaylananOdemeler.filter(o => {
          if (!o.onayTarihi) return false;
          const odemeTarihi = o.onayTarihi.toDate();
          return odemeTarihi.getFullYear() === selectedYil;
        });
      }

      if (selectedAy !== 'all') {
        filteredOdemeler = filteredOdemeler.filter(o => {
          if (!o.onayTarihi) return false;
          const odemeTarihi = o.onayTarihi.toDate();
          return odemeTarihi.getMonth() + 1 === selectedAy;
        });
      }

      // Giderleri filtrele
      let filteredGiderler = giderlerData;
      if (selectedYil) {
        filteredGiderler = filteredGiderler.filter(g => {
          const giderTarihi = g.tarih.toDate();
          return giderTarihi.getFullYear() === selectedYil;
        });
      }
      if (selectedAy !== 'all') {
        filteredGiderler = filteredGiderler.filter(g => {
          const giderTarihi = g.tarih.toDate();
          return giderTarihi.getMonth() + 1 === selectedAy;
        });
      }

      // Toplam hesaplamalar
      const gelir = filteredOdemeler.reduce((toplam, o) => toplam + (o.toplamTutar || 0), 0);
      const faturaToplam = filteredFaturalar.reduce((toplam, f) => toplam + (f.toplamTutar || 0), 0);
      const giderToplam = filteredGiderler.reduce((toplam, g) => toplam + (g.tutar || 0), 0);
      const alacak = faturaToplam - gelir;
      const kar = gelir - giderToplam;
      const zarar = kar < 0 ? Math.abs(kar) : 0;
      const netKar = kar > 0 ? kar : 0;

      setToplamGelir(gelir);
      setToplamFatura(faturaToplam);
      setToplamAlacak(alacak);
      setToplamGider(giderToplam);
      setToplamKar(netKar);
      setToplamZarar(zarar);

      // Aylık döküm hesapla
      calculateAylikDokum(faturalarData, onaylananOdemeler, giderlerData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showError('Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateAylikDokum = (faturalar: Fatura[], onaylananOdemeler: Odeme[], giderler: Gider[]) => {
    const dokumMap = new Map<string, AylikDokum>();

    // Faturaları işle
    faturalar.forEach(fatura => {
      const key = `${fatura.faturaDonemi.yil}-${fatura.faturaDonemi.ay}`;
      if (!dokumMap.has(key)) {
        dokumMap.set(key, {
          yil: fatura.faturaDonemi.yil,
          ay: fatura.faturaDonemi.ay,
          ayAdi: ayIsimleri[fatura.faturaDonemi.ay - 1],
          toplamFatura: 0,
          tahsilat: 0,
          gider: 0,
          kar: 0,
          zarar: 0,
          alacak: 0,
          faturaSayisi: 0,
          odemeSayisi: 0,
          giderSayisi: 0,
        });
      }
      const dokum = dokumMap.get(key)!;
      dokum.toplamFatura += fatura.toplamTutar || 0;
      dokum.faturaSayisi += 1;
    });

    // Ödemeleri işle
    onaylananOdemeler.forEach(odeme => {
      if (!odeme.onayTarihi) return;
      const odemeTarihi = odeme.onayTarihi.toDate();
      const yil = odemeTarihi.getFullYear();
      const ay = odemeTarihi.getMonth() + 1;
      const key = `${yil}-${ay}`;
      
      if (!dokumMap.has(key)) {
        dokumMap.set(key, {
          yil,
          ay,
          ayAdi: ayIsimleri[ay - 1],
          toplamFatura: 0,
          tahsilat: 0,
          gider: 0,
          kar: 0,
          zarar: 0,
          alacak: 0,
          faturaSayisi: 0,
          odemeSayisi: 0,
          giderSayisi: 0,
        });
      }
      const dokum = dokumMap.get(key)!;
      dokum.tahsilat += odeme.toplamTutar || 0;
      dokum.odemeSayisi += 1;
    });

    // Giderleri işle
    giderler.forEach(gider => {
      const giderTarihi = gider.tarih.toDate();
      const yil = giderTarihi.getFullYear();
      const ay = giderTarihi.getMonth() + 1;
      const key = `${yil}-${ay}`;
      
      if (!dokumMap.has(key)) {
        dokumMap.set(key, {
          yil,
          ay,
          ayAdi: ayIsimleri[ay - 1],
          toplamFatura: 0,
          tahsilat: 0,
          gider: 0,
          kar: 0,
          zarar: 0,
          alacak: 0,
          faturaSayisi: 0,
          odemeSayisi: 0,
          giderSayisi: 0,
        });
      }
      const dokum = dokumMap.get(key)!;
      dokum.gider += gider.tutar || 0;
      dokum.giderSayisi += 1;
    });

    // Alacak, kar ve zarar hesapla
    dokumMap.forEach(dokum => {
      dokum.alacak = dokum.toplamFatura - dokum.tahsilat;
      const netGelir = dokum.tahsilat - dokum.gider;
      dokum.kar = netGelir > 0 ? netGelir : 0;
      dokum.zarar = netGelir < 0 ? Math.abs(netGelir) : 0;
    });

    // Sırala (yeni -> eski)
    const sortedDokum = Array.from(dokumMap.values()).sort((a, b) => {
      if (a.yil !== b.yil) return b.yil - a.yil;
      return b.ay - a.ay;
    });

    setAylikDokum(sortedDokum);
  };

  const exportToCSV = () => {
    const headers = ['Yıl', 'Ay', 'Toplam Fatura', 'Tahsilat', 'Gider', 'Kar', 'Zarar', 'Alacak', 'Fatura Sayısı', 'Ödeme Sayısı', 'Gider Sayısı'];
    const rows = aylikDokum.map(d => [
      d.yil,
      d.ayAdi,
      d.toplamFatura.toFixed(2),
      d.tahsilat.toFixed(2),
      d.gider.toFixed(2),
      d.kar.toFixed(2),
      d.zarar.toFixed(2),
      d.alacak.toFixed(2),
      d.faturaSayisi,
      d.odemeSayisi,
      d.giderSayisi,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finans-raporu-${selectedYil}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold">Finans Yönetimi</h1>
        <div className="flex gap-4">
          <select
            value={selectedYil}
            onChange={(e) => setSelectedYil(Number(e.target.value))}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(yil => (
              <option key={yil} value={yil}>{yil}</option>
            ))}
          </select>
          <select
            value={selectedAy}
            onChange={(e) => setSelectedAy(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            <option value="all">Tüm Aylar</option>
            {ayIsimleri.map((ay, index) => (
              <option key={index} value={index + 1}>{ay}</option>
            ))}
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 flex items-center gap-2"
          >
            <Download size={18} />
            CSV İndir
          </button>
        </div>
      </motion.div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Gelir</p>
              <p className="text-3xl font-bold text-accent-green">
                {toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className="p-3 rounded-lg bg-accent-green bg-opacity-20">
              <TrendingUp className="text-accent-green" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Fatura</p>
              <p className="text-3xl font-bold text-blue-500">
                {toplamFatura.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500 bg-opacity-20">
              <FileText className="text-blue-500" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Alacak Miktarı</p>
              <p className={`text-3xl font-bold ${toplamAlacak > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                {toplamAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className={`p-3 rounded-lg ${toplamAlacak > 0 ? 'bg-accent-red bg-opacity-20' : 'bg-accent-green bg-opacity-20'}`}>
              <DollarSign className={toplamAlacak > 0 ? 'text-accent-red' : 'text-accent-green'} size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Gider</p>
              <p className="text-3xl font-bold text-orange-500">
                {toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500 bg-opacity-20">
              <TrendingDown className="text-orange-500" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Net Kar/Zarar</p>
              <p className={`text-3xl font-bold ${toplamKar > 0 ? 'text-accent-green' : toplamZarar > 0 ? 'text-accent-red' : 'text-dark-text'}`}>
                {toplamKar > 0 
                  ? `+${toplamKar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                  : toplamZarar > 0
                  ? `-${toplamZarar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                  : '0.00 ₺'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${toplamKar > 0 ? 'bg-accent-green bg-opacity-20' : toplamZarar > 0 ? 'bg-accent-red bg-opacity-20' : 'bg-gray-500 bg-opacity-20'}`}>
              <ProfitIcon className={toplamKar > 0 ? 'text-accent-green' : toplamZarar > 0 ? 'text-accent-red' : 'text-gray-500'} size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Aylık Döküm */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Aylık Döküm</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left p-4">Yıl</th>
                <th className="text-left p-4">Ay</th>
                <th className="text-right p-4">Toplam Fatura</th>
                <th className="text-right p-4">Tahsilat</th>
                <th className="text-right p-4">Gider</th>
                <th className="text-right p-4">Kar/Zarar</th>
                <th className="text-right p-4">Alacak</th>
                <th className="text-center p-4">Fatura</th>
                <th className="text-center p-4">Ödeme</th>
                <th className="text-center p-4">Gider</th>
              </tr>
            </thead>
            <tbody>
              {aylikDokum.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-8 text-dark-text-secondary">
                    Henüz veri bulunmuyor
                  </td>
                </tr>
              ) : (
                aylikDokum.map((dokum) => (
                  <tr key={`${dokum.yil}-${dokum.ay}`} className="border-b border-dark-border hover:bg-dark-card-hover">
                    <td className="p-4">{dokum.yil}</td>
                    <td className="p-4">{dokum.ayAdi}</td>
                    <td className="p-4 text-right font-semibold">
                      {dokum.toplamFatura.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4 text-right text-accent-green">
                      {dokum.tahsilat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4 text-right text-orange-500">
                      {dokum.gider.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </td>
                    <td className={`p-4 text-right font-semibold ${dokum.kar > 0 ? 'text-accent-green' : dokum.zarar > 0 ? 'text-accent-red' : 'text-dark-text'}`}>
                      {dokum.kar > 0 
                        ? `+${dokum.kar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                        : dokum.zarar > 0
                        ? `-${dokum.zarar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                        : '0.00 ₺'}
                    </td>
                    <td className={`p-4 text-right font-semibold ${dokum.alacak > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                      {dokum.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4 text-center">{dokum.faturaSayisi}</td>
                    <td className="p-4 text-center">{dokum.odemeSayisi}</td>
                    <td className="p-4 text-center">{dokum.giderSayisi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
