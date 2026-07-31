import { useEffect, useState } from 'react';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Reservation } from '@/types';
import { Badge, EmptyState, ErrorBanner, Modal, Skeleton } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export function ReservationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [withdrawItem, setWithdrawItem] = useState<Reservation | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.reservations();
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doWithdraw = async (r: Reservation) => {
    const id = r.transactionId || r.reservationId;
    setBusyId(id);
    try {
      await api.withdrawReservation(id, true);
      toast('Reservation withdrawn.', 'success');
      setWithdrawItem(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not withdraw reservation.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">My reservations</h1>
        <p className="mt-1 text-sm text-ink-500">
          Books you're waiting for. Withdraw a request if you no longer need it.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-7 w-7" />}
          title="No reservations"
          description="When a book is checked out, join the queue from the catalog."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const id = r.transactionId || r.reservationId;
            const isWaiting = (r.status ?? '').toUpperCase() === 'WAITING';
            return (
              <article key={r.reservationId} className="card overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                      <Bookmark className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink-900">{r.title}</h3>
                        {r.status && <Badge tone="brand">{r.status}</Badge>}
                      </div>
                      <p className="text-sm text-ink-500">by {r.author}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                        <Detail label="Reserved on" value={formatDate(r.reservedDate)} />
                        {r.queuePosition != null && (
                          <Detail label="Queue position" value={`#${r.queuePosition}`} tone="text-accent-700" />
                        )}
                        <Detail label="Status" value={r.status || 'Pending'} tone="text-brand-600" />
                      </div>
                    </div>
                  </div>

                  {isWaiting && (
                    <div className="flex items-center border-t border-ink-100 p-4 lg:justify-center lg:border-l lg:border-t-0">
                      <button
                        onClick={() => setWithdrawItem(r)}
                        className="btn-danger w-full lg:w-44"
                        disabled={busyId === id}
                      >
                        {busyId === id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Withdraw reservation
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={!!withdrawItem}
        onClose={() => setWithdrawItem(null)}
        title="Withdraw reservation?"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setWithdrawItem(null)} disabled={!!busyId}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => withdrawItem && doWithdraw(withdrawItem)}
              disabled={!!busyId}
            >
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Withdraw
            </button>
          </>
        }
      >
        {withdrawItem && (
          <p className="text-sm text-ink-600">
            You'll lose your spot in the queue for{' '}
            <span className="font-semibold text-ink-900">{withdrawItem.title}</span>. This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-400">{label}</span>
      <span className={`font-semibold ${tone ?? 'text-ink-700'}`}>{value}</span>
    </div>
  );
}
