import { useLocation } from 'react-router-dom';
import Header from '../components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isTeamPage = location.pathname === '/';

  return (
    <>
      {!isLoginPage && !isTeamPage && <Header backText="Go Back" />}
      {children}
    </>
  );
} 