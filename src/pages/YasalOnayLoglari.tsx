import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { FileText, Calendar, Mail, User, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnayLog {
  id: string;
  diyetisyenId: string;
  diyetisyenEmail: string;
  diyetisyenAdSoyad: string;
  islemTipi: string;
  aciklama: string;
  detaylar: {
    gizlilikPolitikasiTR: boolean;
    privacyPolicyEN: boolean;
    kvkk: boolean;
    uyelikSozlesmesi: boolean;
  };
  tarih: Timestamp;
  ipAdresi?: string;
  userAgent?: string;
}

export default function YasalOnayLoglari() {
  const [logs, setLogs] = useState<OnayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<OnayLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(log =>
        log.diyetisyenEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.diyetisyenAdSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'yasalOnayLoglari'),
        orderBy('tarih', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const logsData: OnayLog[] = [];
      
      querySnapshot.forEach((doc) => {
        logsData.push({
          id: doc.id,
          ...doc.data(),
        } as OnayLog);
      });
      
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch (error) {
      console.error('Log yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-text flex items-center gap-3">
            <FileText className="text-accent-primary" size={32} />
            Yasal Onay Logları
          </h1>
          <p className="text-dark-text-secondary mt-2">
            Diyetisyenlerin kayıt sırasında onayladığı yasal evrakların log kayıtları
          </p>
        </div>
      </div>

      {/* Arama */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
          <input
            type="text"
            placeholder="E-posta, ad soyad veya log ID ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm">Toplam Log</p>
              <p className="text-2xl font-bold text-dark-text mt-1">{logs.length}</p>
            </div>
            <FileText className="text-accent-primary" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm">Benzersiz Diyetisyen</p>
              <p className="text-2xl font-bold text-dark-text mt-1">
                {new Set(logs.map(log => log.diyetisyenId)).size}
              </p>
            </div>
            <User className="text-accent-primary" size={32} />
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
              <p className="text-dark-text-secondary text-sm">Bu Ay</p>
              <p className="text-2xl font-bold text-dark-text mt-1">
                {logs.filter(log => {
                  const logDate = log.tarih?.toDate();
                  const now = new Date();
                  return logDate && logDate.getMonth() === now.getMonth() && 
                         logDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="text-accent-primary" size={32} />
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
              <p className="text-dark-text-secondary text-sm">Filtrelenmiş</p>
              <p className="text-2xl font-bold text-dark-text mt-1">{filteredLogs.length}</p>
            </div>
            <Filter className="text-accent-primary" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Log Listesi */}
      <div className="card">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-dark-text-secondary mb-4" size={48} />
            <p className="text-dark-text-secondary">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz log kaydı bulunmuyor'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-card-hover">
                  <th className="text-left py-3 px-4 text-dark-text-secondary font-semibold">Diyetisyen</th>
                  <th className="text-left py-3 px-4 text-dark-text-secondary font-semibold">E-posta</th>
                  <th className="text-left py-3 px-4 text-dark-text-secondary font-semibold">Onaylanan Evraklar</th>
                  <th className="text-left py-3 px-4 text-dark-text-secondary font-semibold">Tarih</th>
                  <th className="text-left py-3 px-4 text-dark-text-secondary font-semibold">IP Adresi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-dark-card-hover hover:bg-dark-card-hover/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-dark-text-secondary" />
                        <span className="text-dark-text font-medium">{log.diyetisyenAdSoyad || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-dark-text-secondary" />
                        <span className="text-dark-text">{log.diyetisyenEmail}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        {log.detaylar?.gizlilikPolitikasiTR && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Gizlilik Politikası (TR)
                          </span>
                        )}
                        {log.detaylar?.privacyPolicyEN && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Privacy Policy (EN)
                          </span>
                        )}
                        {log.detaylar?.kvkk && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            KVKK
                          </span>
                        )}
                        {log.detaylar?.uyelikSozlesmesi && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Üyelik Sözleşmesi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-dark-text-secondary" />
                        <span className="text-dark-text text-sm">{formatDate(log.tarih)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-dark-text-secondary text-sm font-mono">
                        {log.ipAdresi || '-'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}





