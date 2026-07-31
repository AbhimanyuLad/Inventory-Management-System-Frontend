import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner className="h-8 w-8 text-brand-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-700',
    brand: 'bg-brand-100 text-brand-700',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`card relative z-10 w-full ${sizes[size]} animate-slide-up overflow-hidden rounded-b-none sm:rounded-b-2xl`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-ink-100 bg-ink-50 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
      <span className="font-medium">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline hover:text-danger-800">
          Retry
        </button>
      )}
    </div>
  );
}
