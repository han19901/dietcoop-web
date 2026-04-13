import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function DiyetisyenOdeme() {
  const navigate = useNavigate();

  useEffect(() => {
    // Eski ödeme sayfasından yeni fatura sayfasına yönlendir
    navigate('/diyetisyen/faturalar', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <FileText size={48} className="mx-auto mb-4 text-accent-green" />
        <p className="text-dark-text-secondary">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
