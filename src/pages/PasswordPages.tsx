import { useState } from 'react';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';
import { Link, navigate } from '@/lib/router';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
      toast('Reset link sent if the email exists.', 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-success-100 bg-success-50 px-4 py-4 text-sm text-success-700">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1">
              If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
            </p>
          </div>
          <Link to="/reset-password" className="btn-primary w-full">
            <KeyRound className="h-4 w-4" /> I have a reset token
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
              {error}
            </div>
          )}
          <div>
            <label className="input-label">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                className="input pl-10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword });
      toast('Password reset. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Paste the token from your email and choose a new password."
      footer={
        <>
          Need a new link?{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
            Request one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {error}
          </div>
        )}
        <div>
          <label className="input-label">Reset token</label>
          <input
            className="input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your token here"
            required
          />
        </div>
        <div>
          <label className="input-label">New password</label>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Must include upper &amp; lower case, a number, and a special character.
          </p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
}
