import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 2 saniye sonra fade out başlat
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.5 }}
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Logo Animasyonu */}
        <motion.img
          src="/DietCoop Logo.png"
          alt="DietCoop"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-20 md:h-24"
        />
        
        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin"
        />
      </div>
    </motion.div>
  );
}













