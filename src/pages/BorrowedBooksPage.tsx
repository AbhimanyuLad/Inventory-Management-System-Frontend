import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { BorrowedBook, FinePolicy } from '@/types';
import { EmptyState, ErrorBanner, Modal, Skeleton } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function policyPoints(p: FinePolicy): string[] {
  const text = p.description || (p as Record<string, unknown>).details as string || p.title || p.name as string || '';
  if (!text) return [];
  const parts = text.split(/(?=(?:^|\s)\d+[.)]\s)/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return text ? [text] : [];
}

function isReturned(b: BorrowedBook) {
  const s = (b.status ?? '').toLowerCase();
  return s.includes('return') || s.includes('completed') || s.includes('done');
}

export function BorrowedBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BorrowedBook[]>([]);
  const [policies, setPolicies] = useState<FinePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<BorrowedBook | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, pol] = await Promise.all([
        api.borrowedBooks(),
        api.finePolicies().catch(() => [] as FinePolicy[]),
      ]);
      setBooks(data);
      setPolicies(pol);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load borrowed books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allPoints = useMemo(() => policies.flatMap(policyPoints), [policies]);

  // New (not-yet-returned) requests shown first.
  const sorted = useMemo(() => {
    return [...books].sort((a, b) => {
      const ar = isReturned(a) ? 1 : 0;
      const br = isReturned(b) ? 1 : 0;
      return ar - br;
    });
  }, [books]);

  const requestReturn = async (book: BorrowedBook) => {
    // Use the transaction UUID returned by the backend.
    setBusyId(book.transactionId);
    try {
      await api.returnRequest(book.transactionId);
      toast(`Return requested for "${book.title}".`, 'success');
      setConfirmReturn(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not request return.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">My borrowed books</h1>
        <p className="mt-1 text-sm text-ink-500">Books you currently have out. Request a return when you're done.</p>
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
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="No borrowed books yet"
          description="Browse the catalog and borrow your first book."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((book) => {
            const overdue = (book.status ?? '').toLowerCase().includes('overdue');
            const returned = isReturned(book);
            const returnedDate = book.returnedDate || book.returnDate;

            return (
              <article key={book.transactionId} className="card overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink-900">{book.title}</h3>
                      <p className="text-sm text-ink-500">by {book.author}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                        <Detail label="Borrowed" value={formatDate(book.borrowedDate)} />
                        <Detail label="Due date" value={formatDate(book.dueDate)} />
                        <Detail label="Returned date" value={formatDate(returnedDate)} />
                        <Detail label="Status" value={book.status || 'Active'} tone={overdue ? 'text-danger-600' : returned ? 'text-success-600' : 'text-brand-600'} />
                        {book.fine != null && book.fine > 0 && (
                          <Detail label="Fine" value={formatINR(book.fine)} tone="text-danger-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-2 border-t border-ink-100 p-4 lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
                    <button
                      onClick={() => setConfirmReturn(book)}
                      className="btn-primary flex-1 lg:w-44"
                      disabled={busyId === book.transactionId || returned}
                    >
                      {busyId === book.transactionId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Request return
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation modal before return */}
      <Modal
        open={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        title="Confirm return request"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmReturn(null)} disabled={!!busyId}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => confirmReturn && requestReturn(confirmReturn)}
              disabled={!!busyId}
            >
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              I agree, continue
            </button>
          </>
        }
      >
        {confirmReturn && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Please review the fines & penalties policy before returning.
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  Late returns may be subject to fines. Confirm that you have read the policy below.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-ink-50 p-4">
              <p className="font-semibold text-ink-900">{confirmReturn.title}</p>
              <p className="text-sm text-ink-500">by {confirmReturn.author}</p>
              {confirmReturn.dueDate && (
                <p className="mt-1 text-xs text-ink-400">Due: {formatDate(confirmReturn.dueDate)}</p>
              )}
            </div>

            {allPoints.length > 0 ? (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-danger-700">
                  <AlertTriangle className="h-4 w-4" /> Fines & penalties policy
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-ink-700">
                  {allPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-xs text-ink-400">
                Please review the fines & penalties section on your dashboard before continuing.
              </p>
            )}
          </div>
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
