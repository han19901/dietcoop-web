import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, type, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-accent-green bg-opacity-20',
          border: 'border-accent-green border-opacity-30',
          text: 'text-accent-green',
          icon: CheckCircle,
        };
      case 'error':
        return {
          bg: 'bg-accent-red bg-opacity-20',
          border: 'border-accent-red border-opacity-30',
          text: 'text-accent-red',
          icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500 bg-opacity-20',
          border: 'border-yellow-500 border-opacity-30',
          text: 'text-yellow-500',
          icon: AlertCircle,
        };
      case 'info':
        return {
          bg: 'bg-blue-500 bg-opacity-20',
          border: 'border-blue-500 border-opacity-30',
          text: 'text-blue-500',
          icon: Info,
        };
    }
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = getToastStyles(toast.type);
            const Icon = styles.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 300, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`${styles.bg} ${styles.border} ${styles.text} 
                  border rounded-lg p-4 shadow-lg backdrop-blur-sm
                  flex items-start gap-3 pointer-events-auto
                  min-w-[300px] max-w-full`}
              >
                <Icon size={20} className="flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-sm font-medium leading-relaxed">
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
                >
                  <X size={18} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}




