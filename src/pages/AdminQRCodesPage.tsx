import { useEffect, useState } from 'react';
import { Download, Loader2, QrCode } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { QRCodeResult } from '@/types';
import { Badge, EmptyState, ErrorBanner, Skeleton } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

export function AdminQRCodesPage() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<QRCodeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generateQRCodes();
      setCodes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate QR codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const data = await api.generateQRCodes();
      setCodes(data);
      toast('QR codes regenerated.', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not regenerate.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">QR code generation</h1>
          <p className="mt-1 text-sm text-ink-500">Generate scannable codes for every book in your inventory.</p>
        </div>
        <button onClick={regenerate} className="btn-primary" disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          Regenerate all
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="mx-auto h-28 w-28" />
              <Skeleton className="mx-auto mt-4 h-4 w-24" />
            </div>
          ))}
        </div>
      ) : codes.length === 0 ? (
        <EmptyState
          icon={<QrCode className="h-7 w-7" />}
          title="No QR codes yet"
          description="Add books to your inventory, then generate codes here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {codes.map((c) => (
            <article key={c.bookId} className="card flex flex-col items-center p-5 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-ink-50 p-2">
                {c.qrCodeUrl ? (
                  <img src={c.qrCodeUrl} alt={`QR for ${c.title ?? c.bookId}`} className="h-full w-full object-contain" />
                ) : c.qrCodeString ? (
                  <div className="flex h-full w-full items-center justify-center bg-white p-1">
                    <QrCode className="h-16 w-16 text-ink-700" />
                  </div>
                ) : (
                  <QrCode className="h-16 w-16 text-ink-300" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink-900">{c.title ?? 'Untitled'}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-400">{c.bookId}</p>
              {c.qrCodeString && (
                <Badge tone="neutral">
                  <Download className="h-3 w-3" /> Code ready
                </Badge>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
