import { type ReactNode } from 'react';
import { BookOpen, Library, ShieldCheck, Sparkles } from 'lucide-react';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold leading-none">BookTrack</p>
              <p className="text-sm text-brand-100">Library Inventory System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Manage your library like never before.
            </h1>
            <p className="mt-4 text-brand-100">
              Borrow, reserve, and track every book in your collection — all in one beautifully
              simple workspace built for readers and librarians alike.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: <Library className="h-5 w-5" />, label: 'Smart catalog' },
                { icon: <ShieldCheck className="h-5 w-5" />, label: 'Role-based access' },
                { icon: <Sparkles className="h-5 w-5" />, label: 'QR generation' },
                { icon: <BookOpen className="h-5 w-5" />, label: 'Borrow & reserve' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <span className="text-brand-100">{f.icon}</span>
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-brand-200">© {new Date().getFullYear()} BookTrack. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-display text-xl font-extrabold text-ink-900">BookTrack</p>
          </div>

          <h2 className="font-display text-3xl font-extrabold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
