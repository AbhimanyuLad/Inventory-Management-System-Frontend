import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bookmark,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  PlusCircle,
  QrCode,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, navigate, useRoute } from '@/lib/router';
import { useIsMobile } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
  { to: '/search', label: 'Browse Books', icon: <Search className="h-[18px] w-[18px]" /> },
  { to: '/borrowed', label: 'My Borrowed Books', icon: <BookOpen className="h-[18px] w-[18px]" /> },
  { to: '/reservations', label: 'Reservations', icon: <Bookmark className="h-[18px] w-[18px]" /> },
  { to: '/fines', label: 'Fines & Penalties', icon: <Wallet className="h-[18px] w-[18px]" /> },
  { to: '/admin/inventory', label: 'Add Books', icon: <PlusCircle className="h-[18px] w-[18px]" />, adminOnly: true },
  { to: '/admin/submissions', label: 'Submissions', icon: <Library className="h-[18px] w-[18px]" />, adminOnly: true },
  { to: '/admin/users', label: 'User Management', icon: <Users className="h-[18px] w-[18px]" />, adminOnly: true },
  { to: '/admin/qrcodes', label: 'QR Codes', icon: <QrCode className="h-[18px] w-[18px]" />, adminOnly: true },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const route = useRoute();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
  const activePath = route.path;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-extrabold leading-none text-ink-900">BookTrack</p>
          <p className="text-[11px] font-medium text-ink-400">Library Inventory</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              }`}
            >
              <span className={active ? 'text-brand-600' : 'text-ink-400'}>{item.icon}</span>
              {item.label}
              {item.adminOnly && (
                <span className="ml-auto rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">
                  ADMIN
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.username}</p>
            <p className="flex items-center gap-1 truncate text-xs text-ink-400">
              {isAdmin ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-brand-500" /> Administrator
                </>
              ) : (
                'Member'
              )}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-100 bg-white md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-card-hover animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <span className="font-display font-extrabold text-ink-900">BookTrack</span>
            </div>
            <div className="w-9" />
          </header>
        )}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
