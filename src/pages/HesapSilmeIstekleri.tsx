import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserX,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  hesapSilmeService,
  DeletionRequestItem,
  DeletionRequestStatus,
} from '@/services/firebase/hesapSilmeService';

type StatusFilter = DeletionRequestStatus | 'all';

const STATUS_LABELS: Record<DeletionRequestStatus, string> = {
  awaiting_admin_approval: 'Onay Bekliyor',
  pending: 'Onay Bekliyor (Eski)',
  approved: 'Onaylandı (İşleniyor)',
  completed: 'Tamamlandı',
  rejected: 'Reddedildi',
  cancelled: 'Kullanıcı İptal Etti',
};

const STATUS_BADGE_CLASS: Record<DeletionRequestStatus, string> = {
  awaiting_admin_approval: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
};

const ROLE_LABELS: Record<string, string> = {
  client: 'Danışan',
  dietitian: 'Diyetisyen',
  admin: 'Admin',
};

export default function HesapSilmeIstekleri() {
  const { showToast } = useToast();
  const [items, setItems] = useState<DeletionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('awaiting_admin_approval');

  // Onay modalı
  const [approveTarget, setApproveTarget] = useState<DeletionRequestItem | null>(null);
  const [approving, setApproving] = useState(false);

  // Red modalı
  const [rejectTarget, setRejectTarget] = useState<DeletionRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadData = async (status: StatusFilter = filter) => {
    try {
      setLoading(true);
      const data = await hesapSilmeService.listRequests(status, 100);
      setItems(data);
    } catch (error: any) {
      console.error('Hesap silme istekleri yüklenemedi:', error);
      showToast(error.message || 'İstekler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const pendingCount = useMemo(
    () =>
      items.filter(
        (i) => i.status === 'awaiting_admin_approval' || i.status === 'pending'
      ).length,
    [items]
  );

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '-';
    try {
      return format(new Date(iso), 'dd MMM yyyy HH:mm', { locale: tr });
    } catch {
      return iso;
    }
  };

  const handleApproveClick = (item: DeletionRequestItem) => {
    setApproveTarget(item);
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    try {
      setApproving(true);
      await hesapSilmeService.approve(approveTarget.id);
      showToast('Hesap silme onaylandı ve işlem tamamlandı', 'success');
      setApproveTarget(null);
      await loadData();
    } catch (error: any) {
      console.error('Onaylama hatası:', error);
      showToast(error.message || 'Onaylama başarısız', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = (item: DeletionRequestItem) => {
    setRejectTarget(item);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    try {
      setRejecting(true);
      await hesapSilmeService.reject(rejectTarget.id, rejectReason.trim() || undefined);
      showToast('İstek reddedildi', 'success');
      setRejectTarget(null);
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      console.error('Reddetme hatası:', error);
      showToast(error.message || 'Reddetme başarısız', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const isPendingRow = (status: DeletionRequestStatus) =>
    status === 'awaiting_admin_approval' || status === 'pending';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <UserX size={28} className="text-accent-red" />
          <div>
            <h1 className="text-3xl font-bold text-dark-text">Hesap Silme İstekleri</h1>
            <p className="text-dark-text-secondary text-sm mt-1">
              Kullanıcı silme istekleri buradan onaylanır veya reddedilir.
            </p>
          </div>
        </div>
        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-dark-card-hover text-dark-text rounded-lg hover:bg-dark-card transition text-sm"
          title="Yenile"
        >
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-dark-card border border-dark-card-hover rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-dark-text-secondary" />
            <span className="text-dark-text-secondary text-sm">Durum:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text text-sm focus:outline-none focus:border-accent-green transition"
          >
            <option value="awaiting_admin_approval">Onay Bekleyenler</option>
            <option value="approved">Onaylandı (İşleniyor)</option>
            <option value="completed">Tamamlanmış</option>
            <option value="rejected">Reddedilmiş</option>
            <option value="cancelled">Kullanıcı İptal Etti</option>
            <option value="all">Hepsi</option>
          </select>

          {filter === 'awaiting_admin_approval' && pendingCount > 0 && (
            <span className="ml-auto px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
              {pendingCount} bekleyen istek
            </span>
          )}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={48} className="text-accent-green animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-dark-card rounded-lg border border-dark-card-hover">
          <UserX size={64} className="mx-auto mb-4 text-dark-text-secondary opacity-50" />
          <p className="text-dark-text-secondary">
            Bu durumda istek bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const fullName = `${item.userName} ${item.userSurname}`.trim() || '(isimsiz)';
            const status = item.status;
            const showActions = isPendingRow(status);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-dark-card border border-dark-card-hover rounded-lg p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Sol: Bilgi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-dark-text truncate">
                        {fullName}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASS[status] || 'bg-gray-500/20 text-gray-400'}`}
                      >
                        {STATUS_LABELS[status] || status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-card-hover text-dark-text-secondary">
                        {ROLE_LABELS[item.userRole] || item.userRole}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-dark-text-secondary">
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{item.userEmail || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={14} className="shrink-0" />
                        <span className="truncate">{item.userPhone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Calendar size={14} className="shrink-0" />
                        <span className="truncate">İstek: {formatDate(item.requestedAt)}</span>
                      </div>
                      {item.completedAt && (
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle size={14} className="shrink-0 text-green-400" />
                          <span className="truncate">Tamamlandı: {formatDate(item.completedAt)}</span>
                        </div>
                      )}
                      {item.rejectedAt && (
                        <div className="flex items-center gap-2 truncate">
                          <XCircle size={14} className="shrink-0 text-red-400" />
                          <span className="truncate">Reddedildi: {formatDate(item.rejectedAt)}</span>
                        </div>
                      )}
                      {item.cancelledAt && (
                        <div className="flex items-center gap-2 truncate">
                          <XCircle size={14} className="shrink-0 text-gray-400" />
                          <span className="truncate">İptal: {formatDate(item.cancelledAt)}</span>
                        </div>
                      )}
                    </div>

                    {item.rejectionReason && (
                      <div className="mt-2 text-xs text-red-300/80">
                        Red sebebi: {item.rejectionReason}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-dark-text-secondary/60 truncate">
                      Kullanıcı ID: {item.userId} · İstek ID: {item.id}
                    </div>
                  </div>

                  {/* Sağ: Aksiyonlar */}
                  {showActions && (
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveClick(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition font-medium text-sm"
                      >
                        <CheckCircle size={16} />
                        Onayla & Sil
                      </button>
                      <button
                        onClick={() => handleRejectClick(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-card-hover text-dark-text rounded-lg hover:bg-red-500/20 hover:text-red-400 transition text-sm"
                      >
                        <XCircle size={16} />
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Onay modalı */}
      <ConfirmModal
        isOpen={!!approveTarget}
        onClose={() => !approving && setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
        title="Hesap Silmeyi Onayla"
        type="danger"
        confirmText={approving ? 'İşleniyor…' : 'Onayla ve Sil'}
        cancelText="Vazgeç"
        message={
          approveTarget
            ? `${approveTarget.userName} ${approveTarget.userSurname} (${ROLE_LABELS[approveTarget.userRole] || approveTarget.userRole}) hesabı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
            : ''
        }
      />

      {/* Red modalı */}
      <ConfirmModal
        isOpen={!!rejectTarget}
        onClose={() => !rejecting && setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title="Hesap Silme İsteğini Reddet"
        type="warning"
        confirmText={rejecting ? 'İşleniyor…' : 'Reddet'}
        cancelText="Vazgeç"
        message={
          rejectTarget
            ? `${rejectTarget.userName} ${rejectTarget.userSurname} kullanıcısının silme isteği reddedilecek. İsterseniz red sebebini aşağıya yazabilirsiniz.`
            : ''
        }
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Red sebebi (opsiyonel)"
          rows={3}
          className="w-full mt-3 px-3 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text text-sm focus:outline-none focus:border-accent-green transition resize-none"
        />
      </ConfirmModal>
    </div>
  );
}
