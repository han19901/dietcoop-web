import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Onay Gerekli',
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'warning',
  children,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-accent-red',
          button: 'btn-danger',
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-500 hover:bg-yellow-600',
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'btn-primary',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
            <div className="card max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={styles.icon} size={24} />
                  <h2 className="text-xl font-bold text-dark-text">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-dark-card-hover rounded-lg transition-colors"
                >
                  <X size={20} className="text-dark-text-secondary" />
                </button>
              </div>

              {/* Message */}
              <p className="text-dark-text-secondary mb-6 leading-relaxed">{message}</p>

              {/* Children (optional additional content) */}
              {children}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-dark-card-hover text-dark-text rounded-lg font-semibold hover:bg-dark-card-hover/80 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 ${styles.button} text-white rounded-lg font-semibold transition-colors`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}




