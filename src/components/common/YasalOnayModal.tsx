import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ExternalLink, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface YasalOnayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (onaylar: {
    gizlilikPolitikasiTR: boolean;
    privacyPolicyEN: boolean;
    kvkk: boolean;
    uyelikSozlesmesi: boolean;
  }) => void;
  title?: string;
  description?: string;
  isRequired?: boolean;
}

export default function YasalOnayModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Yasal Evrakları Onaylayın',
  description = 'Devam edebilmek için lütfen aşağıdaki yasal evrakları okuyup onaylayın.',
  isRequired = true,
}: YasalOnayModalProps) {
  const [onaylar, setOnaylar] = useState({
    gizlilikPolitikasiTR: false,
    privacyPolicyEN: false,
    kvkk: false,
    uyelikSozlesmesi: false,
  });
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (isRequired) {
      if (!onaylar.gizlilikPolitikasiTR || !onaylar.privacyPolicyEN || !onaylar.kvkk || !onaylar.uyelikSozlesmesi) {
        setError('Lütfen tüm yasal evrakları onaylayın.');
        return;
      }
    }
    onConfirm(onaylar);
    setOnaylar({
      gizlilikPolitikasiTR: false,
      privacyPolicyEN: false,
      kvkk: false,
      uyelikSozlesmesi: false,
    });
    setError('');
  };

  const handleClose = () => {
    if (!isRequired) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="text-accent-primary" size={24} />
                  <h2 className="text-2xl font-bold text-dark-text">{title}</h2>
                </div>
                {!isRequired && (
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-dark-card-hover rounded-lg transition-colors"
                  >
                    <X size={20} className="text-dark-text-secondary" />
                  </button>
                )}
              </div>

              <p className="text-dark-text-secondary mb-6">{description}</p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-6"
                >
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              {/* Onay Kutucukları */}
              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer group p-4 bg-dark-card-hover/50 rounded-xl hover:bg-dark-card-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={onaylar.gizlilikPolitikasiTR}
                    onChange={(e) =>
                      setOnaylar({ ...onaylar, gizlilikPolitikasiTR: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                      <Link
                        to="/hukuki-evraklar/privacy-policy-dietitian-tr"
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Gizlilik Politikası (TR)
                        <ExternalLink size={12} />
                      </Link>
                      {' '}metnini okudum ve kabul ediyorum.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group p-4 bg-dark-card-hover/50 rounded-xl hover:bg-dark-card-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={onaylar.privacyPolicyEN}
                    onChange={(e) =>
                      setOnaylar({ ...onaylar, privacyPolicyEN: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                      <Link
                        to="/hukuki-evraklar/privacy-policy-dietitian-en"
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy (EN)
                        <ExternalLink size={12} />
                      </Link>
                      {' '}I have read and accept.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group p-4 bg-dark-card-hover/50 rounded-xl hover:bg-dark-card-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={onaylar.kvkk}
                    onChange={(e) => setOnaylar({ ...onaylar, kvkk: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                      <Link
                        to="/hukuki-evraklar/kvkk-aydinlatma-diyetisyen"
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        KVKK Aydınlatma Metni
                        <ExternalLink size={12} />
                      </Link>
                      {' '}metnini okudum ve kabul ediyorum.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group p-4 bg-dark-card-hover/50 rounded-xl hover:bg-dark-card-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={onaylar.uyelikSozlesmesi}
                    onChange={(e) =>
                      setOnaylar({ ...onaylar, uyelikSozlesmesi: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                      <Link
                        to="/hukuki-evraklar/diyetisyen-uyelik-sozlesmesi"
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Diyetisyen Üyelik Sözleşmesi
                        <ExternalLink size={12} />
                      </Link>
                      {' '}metnini okudum ve kabul ediyorum.
                    </span>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                {!isRequired && (
                  <button
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-dark-card-hover text-dark-text rounded-lg font-semibold hover:bg-dark-card-hover/80 transition-colors"
                  >
                    İptal
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className="flex-1 btn-primary"
                >
                  Onayla ve Devam Et
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}





