import { useEffect, useState } from 'react';
import { Check, Loader2, Library } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { BookSubmission } from '@/types';
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

// Statuses that require a fine reason.
const REASON_STATUSES = ['DAMAGED', 'LOST'];

export function AdminSubmissionsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<BookSubmission[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState<BookSubmission | null>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ status: string; reason: string }>({
    status: '',
    reason: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, sts] = await Promise.all([
        api.submissionRequests(),
        api.transactionStatuses().catch(() => [] as string[]),
      ]);
      setItems(data);
      setStatuses(sts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReview = (sub: BookSubmission) => {
    setReview(sub);
    setDecision({
      status: statuses[0] || sub.status || 'APPROVED',
      reason: '',
    });
  };

  const submit = async () => {
    if (!review) return;
    setBusy(true);
    try {
      await api.approveSubmission({
        transactionId: review.transactionId,
        status: decision.status,
        reason: decision.reason,
      });
      toast(`Submission marked as ${decision.status}.`, 'success');
      setReview(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not update submission.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const needsReason = REASON_STATUSES.includes((decision.status || '').toUpperCase());

  // Render every non-id field returned by the backend.
  const renderFields = (sub: BookSubmission) => {
    const skip = new Set(['transactionId', 'bookId', 'copyId']);
    const entries = Object.entries(sub).filter(([k]) => !skip.has(k));
    return entries.map(([k, v]) => {
      if (v == null || v === '') return null;
      let display: string;
      if (typeof v === 'number') display = k.toLowerCase().includes('fine') ? formatINR(v) : String(v);
      else if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}/.test(v)) display = formatDate(v);
      else display = String(v);
      const label = k
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return <Detail key={k} label={label} value={display} />;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Book submissions</h1>
        <p className="mt-1 text-sm text-ink-500">Review and process return requests from members.</p>
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
          icon={<Library className="h-7 w-7" />}
          title="No pending submissions"
          description="Return requests will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {items.map((sub) => (
            <article key={sub.transactionId} className="card overflow-hidden">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Library className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink-900">{sub.title || 'Untitled book'}</h3>
                    {sub.status && <Badge tone="brand">{sub.status}</Badge>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                    {renderFields(sub)}
                  </div>
                </div>
                <button onClick={() => openReview(sub)} className="btn-primary self-start">
                  <Check className="h-4 w-4" /> Review
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title="Review submission"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReview(null)} disabled={busy}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Submit decision
            </button>
          </>
        }
      >
        {review && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="font-semibold text-ink-900">{review.title || 'Untitled book'}</p>
              <p className="text-sm text-ink-500">{review.user || review.email || 'Unknown member'}</p>
            </div>

            {/* Transaction status — dropdown from backend enum values */}
            <div>
              <label className="input-label">Transaction status</label>
              <select
                className="input"
                value={decision.status}
                onChange={(e) => setDecision((d) => ({ ...d, status: e.target.value }))}
              >
                {statuses.length > 0 ? (
                  statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                ) : (
                  <option value={decision.status}>{decision.status}</option>
                )}
              </select>
            </div>

            {/* Fine amount — calculated by backend, displayed only */}
            {review.fine != null && review.fine > 0 && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                <p className="text-xs font-medium text-danger-600">Calculated fine</p>
                <p className="font-display text-xl font-extrabold text-danger-700">
                  {formatINR(review.fine)}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  This amount is calculated by the system based on the return status.
                </p>
              </div>
            )}

            {/* Fine reason — only for DAMAGED or LOST */}
            {needsReason && (
              <div>
                <label className="input-label">Fine reason</label>
                <textarea
                  className="input min-h-[80px]"
                  value={decision.reason}
                  onChange={(e) => setDecision((d) => ({ ...d, reason: e.target.value }))}
                  placeholder={`Explain why this book is marked ${decision.status}…`}
                />
              </div>
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
