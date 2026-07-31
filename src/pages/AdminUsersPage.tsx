import { useState } from 'react';
import { Loader2, ShieldCheck, UserX, UserCog } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui';

export function AdminUsersPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'admin' | 'deactivate' | null>(null);
  const [confirm, setConfirm] = useState<null | 'admin' | 'deactivate'>(null);

  const makeAdmin = async () => {
    setBusy('admin');
    try {
      await api.makeAdmin({ email });
      toast(`${email} is now an administrator.`, 'success');
      setEmail('');
      setConfirm(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not promote user.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const deactivate = async () => {
    setBusy('deactivate');
    try {
      await api.deactivateUser({ email });
      toast(`${email} has been deactivated.`, 'success');
      setEmail('');
      setConfirm(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not deactivate user.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">User management</h1>
        <p className="mt-1 text-sm text-ink-500">Promote members to admin or deactivate accounts.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">Make admin</h2>
              <p className="text-xs text-ink-500">Grant admin privileges to a member.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <input
              className="input"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={() => setConfirm('admin')}
              className="btn-primary w-full"
              disabled={!validEmail || busy !== null}
            >
              <UserCog className="h-4 w-4" /> Promote to admin
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-100 text-danger-700">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">Deactivate user</h2>
              <p className="text-xs text-ink-500">Suspend a member's access to the library.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <input
              className="input"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={() => setConfirm('deactivate')}
              className="btn-danger w-full"
              disabled={!validEmail || busy !== null}
            >
              <UserX className="h-4 w-4" /> Deactivate account
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'admin' ? 'Promote to admin?' : 'Deactivate user?'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)} disabled={busy !== null}>
              Cancel
            </button>
            <button
              className={confirm === 'admin' ? 'btn-primary' : 'btn-danger'}
              onClick={confirm === 'admin' ? makeAdmin : deactivate}
              disabled={busy !== null}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          {confirm === 'admin' ? (
            <>
              This will grant full admin privileges to <span className="font-semibold text-ink-900">{email}</span>,
              including inventory and user management.
            </>
          ) : (
            <>
              This will deactivate <span className="font-semibold text-ink-900">{email}</span>. The member will lose
              access until reactivated.
            </>
          )}
        </p>
      </Modal>
    </div>
  );
}
