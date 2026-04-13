import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  DollarSign,
  Search,
  Plus,
  Minus,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { stratejikPartnerService } from '@/services/firebase/stratejikPartnerService';
import {
  StratejikPartnerFirma,
  StratejikPartnerGorusme,
  StratejikPartnerRandevu,
  StratejikPartnerZiyaret,
  StratejikPartnerSatis,
  StratejikPartnerCiro,
  StratejikPartnerLog,
  StratejikPartnerOdeme,
} from '@/types/stratejikPartner';

const LOG_TIPI_LABEL: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  data_eklendi: { label: 'Veri Eklendi', icon: Plus, color: 'text-green-400' },
  data_silindi: { label: 'Veri Silindi', icon: Minus, color: 'text-red-400' },
  arama_yapildi: { label: 'Arama Yapıldı', icon: Search, color: 'text-blue-400' },
  arama_notu: { label: 'Arama Notu', icon: FileText, color: 'text-amber-400' },
  randevu: { label: 'Randevu', icon: Calendar, color: 'text-purple-400' },
  ziyaret: { label: 'Ziyaret', icon: MapPin, color: 'text-cyan-400' },
  teklif: { label: 'Teklif', icon: FileText, color: 'text-orange-400' },
  diger: { label: 'Diğer', icon: Activity, color: 'text-gray-400' },
};

function formatTarih(ts: { toDate?: () => Date } | string) {
  if (typeof ts === 'string') return new Date(ts).toLocaleDateString('tr-TR');
  return ts?.toDate?.()?.toLocaleDateString('tr-TR') || '-';
}

function formatPara(tutar: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(tutar);
}

export default function StratejikPartnerDashboard() {
  const [firmalar, setFirmalar] = useState<StratejikPartnerFirma[]>([]);
  const [gorusmeler, setGorusmeler] = useState<StratejikPartnerGorusme[]>([]);
  const [randevular, setRandevular] = useState<StratejikPartnerRandevu[]>([]);
  const [ziyaretler, setZiyaretler] = useState<StratejikPartnerZiyaret[]>([]);
  const [satislar, setSatislar] = useState<StratejikPartnerSatis[]>([]);
  const [cirolar, setCirolar] = useState<StratejikPartnerCiro[]>([]);
  const [loglar, setLoglar] = useState<StratejikPartnerLog[]>([]);
  const [odemeler, setOdemeler] = useState<StratejikPartnerOdeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, g, r, z, s, c, l, o] = await Promise.all([
        stratejikPartnerService.getFirmalar(),
        stratejikPartnerService.getGorusmeler(),
        stratejikPartnerService.getRandevular(),
        stratejikPartnerService.getZiyaretler(),
        stratejikPartnerService.getSatislar(),
        stratejikPartnerService.getCirolar(),
        stratejikPartnerService.getLoglar(),
        stratejikPartnerService.getOdemeler(),
      ]);
      setFirmalar(f);
      setGorusmeler(g);
      setRandevular(r);
      setZiyaretler(z);
      setSatislar(s);
      setCirolar(c);
      setLoglar(l);
      setOdemeler(o);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const satisaDonusen = satislar.filter((s) => s.durum === 'satisa_donustu');
  const satisaDonusmeyen = satislar.filter((s) => s.durum === 'satisa_donusmedi');

  const firmaIdsWithProcess = new Set([
    ...gorusmeler.map((g) => g.firmaId),
    ...randevular.map((r) => r.firmaId),
    ...ziyaretler.map((z) => z.firmaId),
    ...satislar.map((s) => s.firmaId),
  ]);
  const surecYapilmamisFirma = firmalar.filter((f) => !firmaIdsWithProcess.has(f.id));

  const ciroAylik = cirolar.filter((c) => c.donem === 'aylik').reduce((a, b) => a + b.tutar, 0);
  const ciro3Aylik = cirolar.filter((c) => c.donem === '3aylik').reduce((a, b) => a + b.tutar, 0);
  const ciro6Aylik = cirolar.filter((c) => c.donem === '6aylik').reduce((a, b) => a + b.tutar, 0);
  const ciro12Aylik = cirolar.filter((c) => c.donem === '12aylik').reduce((a, b) => a + b.tutar, 0);

  const toplamOdenen = odemeler.filter((o) => o.durum === 'odendi').reduce((a, b) => a + b.tutar, 0);
  const bekleyenBakiye = odemeler.filter((o) => o.durum === 'beklemede').reduce((a, b) => a + b.tutar, 0);
  const tahsilEdilen = odemeler.reduce((a, b) => a + (b.tahsilEdilenBakiye || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
      <div className="fixed top-4 left-4 w-16 h-16 opacity-20 pointer-events-none z-0">
        <img src="/growerdisilogo.svg" alt="" className="w-full h-full" />
      </div>
      <div className="fixed top-4 right-4 w-16 h-16 opacity-20 pointer-events-none z-0">
        <img src="/growerdisilogo.svg" alt="" className="w-full h-full scale-x-[-1]" />
      </div>
      <div className="fixed bottom-4 left-4 w-16 h-16 opacity-20 pointer-events-none z-0">
        <img src="/growerdisilogo.svg" alt="" className="w-full h-full scale-y-[-1]" />
      </div>
      <div className="fixed bottom-4 right-4 w-16 h-16 opacity-20 pointer-events-none z-0">
        <img src="/growerdisilogo.svg" alt="" className="w-full h-full scale-[-1]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-6 mb-12 py-6 border-b border-white/10"
        >
          <img src="/growerdisilogo.svg" alt="With Grower" className="w-14 h-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/DietCoop Logo.png'; }} />
          <span className="text-2xl text-[#00ff88] font-bold">×</span>
          <img src="/DietCoop Logo.png" alt="DietCoop" className="w-14 h-14 object-contain" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">Stratejik Partner Dashboard</h1>
            <p className="text-white/60 text-sm">Süreç Bilgilendirme & Performans Takibi</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MessageSquare, label: 'Görüşmeler', value: gorusmeler.length, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
            { icon: Calendar, label: 'Randevular', value: randevular.length, color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
            { icon: MapPin, label: 'Ziyaretler', value: ziyaretler.length, color: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/30' },
            { icon: Building2, label: 'Toplam Firma', value: firmalar.length, color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`p-6 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border}`}>
              <item.icon className="w-8 h-8 text-white/80 mb-3" />
              <p className="text-3xl font-bold text-white">{item.value}</p>
              <p className="text-white/60 text-sm">{item.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30">
            <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
            <p className="text-3xl font-bold text-white">{satisaDonusen.length}</p>
            <p className="text-white/60 text-sm">Satışa Dönüşen İşler</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/30">
            <TrendingDown className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-3xl font-bold text-white">{satisaDonusmeyen.length}</p>
            <p className="text-white/60 text-sm">Satışa Dönüşmeyen İşler</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30">
            <Building2 className="w-8 h-8 text-orange-400 mb-3" />
            <p className="text-3xl font-bold text-white">{surecYapilmamisFirma.length}</p>
            <p className="text-white/60 text-sm">Süreç Yapılmamış Firma</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#00ff88]" />Ciro Özeti</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ label: 'Aylık Ciro', value: ciroAylik }, { label: '3 Aylık Ciro', value: ciro3Aylik }, { label: '6 Aylık Ciro', value: ciro6Aylik }, { label: '12 Aylık Ciro', value: ciro12Aylik }].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-dark-card border border-white/10">
                <p className="text-white/60 text-sm mb-1">{item.label}</p>
                <p className="text-xl font-bold text-[#00ff88]">{formatPara(item.value)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#00ff88]" />Finansal Geçmiş</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-white/60 text-sm">Tahsil Edilen Bakiye</p>
              <p className="text-2xl font-bold text-green-400">{formatPara(tahsilEdilen)}</p>
            </div>
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-white/60 text-sm">Bekleyen Bakiye</p>
              <p className="text-2xl font-bold text-amber-400">{formatPara(bekleyenBakiye)}</p>
            </div>
            <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-white/60 text-sm">Yapılan Ödemeler</p>
              <p className="text-2xl font-bold text-blue-400">{formatPara(toplamOdenen)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-dark-card border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 font-semibold text-white">Son Ödemeler</div>
            <div className="max-h-48 overflow-y-auto">
              {odemeler.slice(0, 10).length === 0 ? (
                <div className="p-8 text-center text-white/50">Henüz ödeme kaydı yok</div>
              ) : (
                odemeler.slice(0, 10).map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5">
                    <div>
                      <p className="font-medium text-white">{o.firmaAdi}</p>
                      <p className="text-sm text-white/50">{o.odemeTarihi} {o.aciklama && `• ${o.aciklama}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#00ff88]">{formatPara(o.tutar)}</p>
                      <span className={`text-xs ${o.durum === 'odendi' ? 'text-green-400' : 'text-amber-400'}`}>{o.durum === 'odendi' ? 'Ödendi' : 'Beklemede'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-6 h-6 text-[#00ff88]" />Süreç Log Kayıtları</h2>
          <div className="rounded-2xl bg-dark-card border border-[#00ff88]/20 overflow-hidden shadow-xl shadow-[#00ff88]/5">
            <div className="p-4 bg-gradient-to-r from-[#00ff88]/10 to-transparent border-b border-white/10">
              <p className="text-white/80 text-sm">Sisteme eklenen veriler, aramalar, randevular, ziyaretler ve tüm aktiviteler</p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {loglar.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Henüz log kaydı bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loglar.map((log, i) => {
                    const tipInfo = LOG_TIPI_LABEL[log.tip] || LOG_TIPI_LABEL.diger;
                    const Icon = tipInfo.icon;
                    return (
                      <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00ff88]/20 transition-colors group">
                        <div className={`p-2 rounded-lg bg-white/5 ${tipInfo.color}`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${tipInfo.color}`}>{tipInfo.label}</span>
                            {log.firmaAdi && <span className="text-xs text-white/50">• {log.firmaAdi}</span>}
                          </div>
                          <p className="text-white mt-1">{log.aciklama}</p>
                          {log.detay && <p className="text-sm text-white/60 mt-1">{log.detay}</p>}
                          <p className="text-xs text-white/40 mt-2">{formatTarih(log.olusturmaTarihi)}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#00ff88] transition-colors flex-shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
