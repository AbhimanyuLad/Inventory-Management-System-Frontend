import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { Fine } from '@/types';
import { Badge, EmptyState, ErrorBanner, Skeleton } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function fineTitle(f: Fine): string {
  return f.title || f.bookTitle || (f as Record<string, unknown>).bookName as string || 'Untitled book';
}

function fineReason(f: Fine): string | undefined {
  return f.reason || (f as Record<string, unknown>).description as string || (f as Record<string, unknown>).note as string || undefined;
}

export function FinesPage() {
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'one' | 'all' | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.fines();
      setFines(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load fines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const outstanding = fines.filter((f) => (f.status ?? '').toLowerCase() !== 'paid');
  const totalOutstanding = outstanding.reduce((sum, f) => sum + (f.amount || 0), 0);

  const payOne = async (fine: Fine) => {
    setPayingId(fine.fineId);
    setBusy('one');
    try {
      await api.payFine({ fineId: fine.fineId });
      toast('Fine paid successfully.', 'success');
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Payment failed.', 'error');
    } finally {
      setBusy(null);
      setPayingId(null);
    }
  };

  const payAll = async () => {
    if (outstanding.length === 0) return;
    setBusy('all');
    try {
      await api.payAllFines(outstanding.map((f) => ({ fineId: f.fineId })));
      toast('All fines paid.', 'success');
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not pay all fines.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Fines & penalties</h1>
          <p className="mt-1 text-sm text-ink-500">Clear overdue fines to keep borrowing.</p>
        </div>
        {!loading && outstanding.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-ink-400">Outstanding total</p>
              <p className="font-display text-2xl font-extrabold text-danger-600">
                {formatINR(totalOutstanding)}
              </p>
            </div>
            <button onClick={payAll} className="btn-primary" disabled={busy !== null}>
              {busy === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Pay all
            </button>
          </div>
        )}
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
      ) : fines.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="No fines — you're all clear"
          description="Return books on time to keep it that way."
        />
      ) : (
        <div className="space-y-3">
          {fines.map((fine) => {
            const paid = (fine.status ?? '').toLowerCase() === 'paid';
            const reason = fineReason(fine);
            const borrower = fine.borrowerName || fine.username || (fine as Record<string, unknown>).member as string;
            const issuedDate = fine.issuedDate || fine.date || (fine as Record<string, unknown>).createdDate as string;
            const dueDate = fine.dueDate || (fine as Record<string, unknown>).returnDueDate as string;
            const daysOverdue = fine.daysOverdue ?? (fine as Record<string, unknown>).overdueDays as number | undefined;
            const rate = fine.rate ?? (fine as Record<string, unknown>).fineRate as number | undefined;
            const author = fine.author || (fine as Record<string, unknown>).bookAuthor as string;

            return (
              <article key={fine.fineId} className="card overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink-900">{fineTitle(fine)}</h3>
                        <Badge tone={paid ? 'success' : 'danger'}>
                          {paid ? 'Paid' : fine.status || 'Outstanding'}
                        </Badge>
                      </div>
                      {author && <p className="text-sm text-ink-500">by {author}</p>}
                      {reason && <p className="mt-2 text-sm text-ink-600">{reason}</p>}
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                        <Detail label="Amount" value={formatINR(fine.amount)} tone="text-danger-600" />
                        {borrower && <Detail label="Borrower" value={borrower} />}
                        <Detail label="Issued date" value={formatDate(issuedDate)} />
                        {dueDate && <Detail label="Due date" value={formatDate(dueDate)} />}
                        {daysOverdue != null && <Detail label="Days overdue" value={String(daysOverdue)} />}
                        {rate != null && <Detail label="Rate" value={formatINR(rate) + '/day'} />}
                        <Detail label="Status" value={paid ? 'Paid' : fine.status || 'Outstanding'} tone={paid ? 'text-success-600' : 'text-danger-600'} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-ink-100 p-4 lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
                    <span className="font-display text-lg font-extrabold text-ink-900 lg:mb-2">
                      {formatINR(fine.amount)}
                    </span>
                    {!paid && (
                      <button
                        onClick={() => payOne(fine)}
                        className="btn-primary lg:w-32"
                        disabled={busy !== null}
                      >
                        {payingId === fine.fineId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
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
