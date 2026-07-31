import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppLayout } from '@/components/AppLayout';
import { navigate, useRoute } from '@/lib/router';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/PasswordPages';
import { DashboardPage } from '@/pages/DashboardPage';
import { SearchBooksPage } from '@/pages/SearchBooksPage';
import { BorrowedBooksPage } from '@/pages/BorrowedBooksPage';
import { ReservationsPage } from '@/pages/ReservationsPage';
import { FinesPage } from '@/pages/FinesPage';
import { AdminInventoryPage } from '@/pages/AdminInventoryPage';
import { AdminSubmissionsPage } from '@/pages/AdminSubmissionsPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { AdminQRCodesPage } from '@/pages/AdminQRCodesPage';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

function isPublic(path: string) {
  return PUBLIC_ROUTES.includes(path);
}

const ADMIN_ROUTES = ['/admin/inventory', '/admin/submissions', '/admin/users', '/admin/qrcodes'];

function Router() {
  const { user, isAdmin } = useAuth();
  const route = useRoute();
  const path = route.path;

  useEffect(() => {
    if (!user && !isPublic(path)) {
      navigate('/login');
    } else if (user && isPublic(path)) {
      navigate('/dashboard');
    } else if (user && !isAdmin && ADMIN_ROUTES.some((r) => path.startsWith(r))) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, path]);

  if (!user) {
    if (path === '/register') return <RegisterPage />;
    if (path === '/forgot-password') return <ForgotPasswordPage />;
    if (path === '/reset-password') return <ResetPasswordPage />;
    return <LoginPage />;
  }

  if (isAdmin && ADMIN_ROUTES.some((r) => path.startsWith(r))) {
    if (path.startsWith('/admin/inventory')) return <AdminInventoryPage />;
    if (path.startsWith('/admin/submissions')) return <AdminSubmissionsPage />;
    if (path.startsWith('/admin/users')) return <AdminUsersPage />;
    if (path.startsWith('/admin/qrcodes')) return <AdminQRCodesPage />;
  }

  if (path === '/search') return <SearchBooksPage />;
  if (path === '/borrowed') return <BorrowedBooksPage />;
  if (path === '/reservations') return <ReservationsPage />;
  if (path === '/fines') return <FinesPage />;

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppRouter() {
  const { user } = useAuth();
  const route = useRoute();
  const path = route.path;

  const isPublicRoute = isPublic(path);
  const showLayout = user && !isPublicRoute;

  if (!showLayout) {
    return <Router />;
  }

  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}
