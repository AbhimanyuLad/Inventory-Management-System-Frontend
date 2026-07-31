import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card flex items-start gap-3 p-4 shadow-card-hover animate-slide-up"
          >
            <span className="mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success-600" />}
              {t.type === 'error' && <XCircle className="h-5 w-5 text-danger-600" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-brand-600" />}
            </span>
            <p className="flex-1 text-sm font-medium text-ink-800">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
