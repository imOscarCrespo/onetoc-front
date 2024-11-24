import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  backText?: string;
  onBack?: () => void;
}

export default function Header({ backText = 'Back', onBack }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login', { replace: true });
  };

  const isMainPage = window.location.pathname.includes('team')

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.location.pathname.includes('team')) {
      navigate('/team');
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="header py-4">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex gap-2 text-sm text-gray-500 transition-colors"
          >
            ← {isMainPage ? 'Change Team' : backText}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}