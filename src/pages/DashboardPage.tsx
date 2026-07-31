import { useEffect, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  Library,
  Loader2,
  Users,
  Wallet,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { Book, DashboardInfo, FinePolicy } from '@/types';
import { ErrorBanner, Skeleton } from '@/components/ui';
import { RecommendedBooks } from '@/components/RecommendedBooks';
import { Link } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: string;
  to?: string;
}

function pickNumber(info: DashboardInfo | null, keys: string[]): number {
  if (!info) return 0;
  for (const k of keys) {
    const v = info[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function policyAmount(p: FinePolicy): number | null {
  const candidates = [p.amount, p.rate, (p as Record<string, unknown>).fine, (p as Record<string, unknown>).penalty];
  for (const c of candidates) {
    if (typeof c === 'number' && !isNaN(c)) return c;
  }
  return null;
}

function policyTitle(p: FinePolicy): string {
  return p.title || p.name || (p as Record<string, unknown>).policyName as string || 'Fine rule';
}

function policyDescription(p: FinePolicy): string | undefined {
  return p.description || (p as Record<string, unknown>).details as string || undefined;
}

// The backend may return the fine policy as a continuous string with numbered
// points (e.g. "1. ... 2. ... 3. ..."). Split it into individual points.
function policyPoints(p: FinePolicy): string[] {
  const text = policyDescription(p);
  if (!text) return [];
  // Split on patterns like "1.", "2.", "1)", "2)" at start of a point.
  const parts = text.split(/(?=(?:^|\s)\d+[.)]\s)/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return [text];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [info, setInfo] = useState<DashboardInfo | null>(null);
  const [policies, setPolicies] = useState<FinePolicy[]>([]);
  const [recs, setRecs] = useState<Book[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, pol] = await Promise.all([
        api.dashboard().catch(() => null),
        api.finePolicies().catch(() => [] as FinePolicy[]),
      ]);
      if (dash) setInfo(dash);
      setPolicies(pol);
      // Fetch recommendations separately so a failure doesn't break the dashboard.
      api.recommendations()
        .then((r) => setRecs(r))
        .catch(() => setRecs([]))
        .finally(() => setRecsLoading(false));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeBorrowed = pickNumber(info, ['activeBorrowed', 'activeBorrows', 'currentBorrowed']);
  const totalReservations = pickNumber(info, ['totalReservations', 'reservations', 'activeReservations']);
  const outstandingFines = pickNumber(info, ['outstandingFines', 'unpaidFines', 'totalFines', 'fines']);
  const totalBorrowed = pickNumber(info, ['totalBorrowed', 'totalBorrows', 'borrowedBooks']);
  const totalUsers = pickNumber(info, ['totalUsers', 'users', 'userCount', 'memberCount']);
  const totalBooks = pickNumber(info, ['totalBooks', 'books', 'bookCount', 'totalTitles', 'totalBorrowed', 'totalBorrows', 'borrowedBooks']);
  const totalCopies = pickNumber(info, ['totalCopies', 'copies', 'copyCount']);
  const availableBooks = pickNumber(info, ['availableBooks', 'availableCopies', 'available', 'availableBooksCount']);
  const borrowedBooks = pickNumber(info, ['borrowedBooks', 'borrowedCopies', 'borrowed', 'borrowedCount', 'totalBorrowed', 'totalBorrows', 'activeBorrowed', 'activeBorrows', 'currentBorrowed']);
  const reservedBooks = pickNumber(info, ['reservedBooks', 'reservedCopies', 'reserved', 'reservedCount', 'totalReservations', 'reservations', 'activeReservations']);

  const stats: StatCard[] = [
    {
      label: 'Active Borrows',
      value: activeBorrowed,
      icon: <BookOpen className="h-5 w-5" />,
      tone: 'bg-brand-50 text-brand-600',
      to: '/borrowed',
    },
    {
      label: 'Reservations',
      value: totalReservations,
      icon: <Bookmark className="h-5 w-5" />,
      tone: 'bg-accent-100 text-accent-700',
      to: '/reservations',
    },
    {
      label: 'Outstanding Fines',
      value: formatINR(outstandingFines),
      icon: <Wallet className="h-5 w-5" />,
      tone: 'bg-danger-50 text-danger-600',
      to: '/fines',
    },
    {
      label: 'Total Books',
      value: totalBooks,
      icon: <Library className="h-5 w-5" />,
      tone: 'bg-success-50 text-success-600',
      to: '/search',
    },
  ];

  const libraryStats: StatCard[] = [
    { label: 'Total Users', value: totalUsers, icon: <Users className="h-5 w-5" />, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Total Books', value: totalBooks, icon: <Library className="h-5 w-5" />, tone: 'bg-accent-100 text-accent-700' },
    { label: 'Total Copies', value: totalCopies, icon: <BookOpen className="h-5 w-5" />, tone: 'bg-success-50 text-success-600' },
    { label: 'Available', value: availableBooks, icon: <BookOpen className="h-5 w-5" />, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Borrowed', value: borrowedBooks, icon: <BookOpen className="h-5 w-5" />, tone: 'bg-warning-100 text-warning-600' },
    { label: 'Reserved', value: reservedBooks, icon: <Bookmark className="h-5 w-5" />, tone: 'bg-accent-100 text-accent-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Welcome back, {user?.username || 'reader'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Here's a snapshot of your library activity.</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="mt-4 h-8 w-16" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
            ))
          : stats.map((s) => (
              <Link
                key={s.label}
                to={s.to ?? '#'}
                className={`card group p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover ${
                  s.to ? '' : 'pointer-events-none'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                  {s.icon}
                </div>
                <p className="mt-4 font-display text-2xl font-extrabold text-ink-900">{s.value}</p>
                <p className="text-sm font-medium text-ink-500">{s.label}</p>
              </Link>
            ))}
      </div>

      <RecommendedBooks books={recs} loading={recsLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-ink-900">Quick actions</h2>
          <p className="mt-1 text-sm text-ink-500">Jump straight to what you need.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              to="/search"
              className="group flex items-center gap-4 rounded-xl border border-ink-100 p-4 transition hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">Browse the catalog</p>
                <p className="text-xs text-ink-500">Find and borrow books</p>
              </div>
            </Link>
            <Link
              to="/reservations"
              className="group flex items-center gap-4 rounded-xl border border-ink-100 p-4 transition hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">My reservations</p>
                <p className="text-xs text-ink-500">Track your queue position</p>
              </div>
            </Link>
          </div>

          <h2 className="mt-8 font-display text-lg font-bold text-ink-900">Library overview</h2>
          <p className="mt-1 text-sm text-ink-500">Inventory and membership statistics from the backend.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 p-4">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="mt-2 h-4 w-20" />
                  </div>
                ))
              : libraryStats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-ink-100 p-4">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}>
                      {s.icon}
                    </div>
                    <p className="font-display text-xl font-extrabold text-ink-900">{s.value}</p>
                    <p className="text-xs font-medium text-ink-500">{s.label}</p>
                  </div>
                ))}
          </div>
        </div>

        {/* Fine policy — red highlighted card */}
        <div className="overflow-hidden rounded-2xl border-2 border-danger-200 bg-danger-50 shadow-card">
          <div className="flex items-center gap-2 border-b border-danger-200 bg-danger-100 px-5 py-4">
            <Wallet className="h-5 w-5 text-danger-700" />
            <h2 className="font-display text-lg font-bold text-danger-800">Fine Policy</h2>
          </div>
          <div className="space-y-3 p-5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : policies.length === 0 ? (
              <p className="text-sm font-medium text-danger-700">No policy details available.</p>
            ) : (
              policies.map((p, i) => {
                const amt = policyAmount(p);
                const points = policyPoints(p);
                return (
                  <div
                    key={p.id ?? i}
                    className="rounded-xl border border-danger-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-800">{policyTitle(p)}</p>
                      {amt != null && (
                        <span className="text-sm font-bold text-danger-700">
                          {formatINR(amt)}
                          {p.perDay ? '/day' : ''}
                        </span>
                      )}
                    </div>
                    {points.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-ink-600">
                        {points.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard…
        </div>
      )}
    </div>
  );
}
