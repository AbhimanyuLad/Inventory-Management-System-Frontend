import { useState } from 'react';
import { Check, Eye, EyeOff, Loader2, UserPlus, X } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';
import { Link, navigate } from '@/lib/router';

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character (@$!%*?&)', test: (p: string) => /[@$!%*?&]/.test(p) },
];

export function RegisterPage() {
  const { register, loading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'free'>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const checkUsername = async (value: string) => {
    if (value.length < 4 || !/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await api.checkUsername(value);
      const available = Boolean(
        res && (res.available || res.exists === false || res.valid === true || res.isAvailable),
      );
      setUsernameStatus(available ? 'free' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      toast('Account created. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed.');
    }
  };

  const pwValid = PW_RULES.every((r) => r.test(form.password));
  const usernameValid =
    form.username.length >= 4 &&
    form.username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(form.username) &&
    usernameStatus !== 'taken';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = pwValid && usernameValid && emailValid && !loading;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join BookTrack to borrow and manage library books."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
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
          <label className="input-label">Username</label>
          <div className="relative">
            <input
              className="input pr-10"
              value={form.username}
              onChange={(e) => {
                set('username')(e);
                setUsernameStatus('idle');
              }}
              onBlur={(e) => checkUsername(e.target.value)}
              placeholder="4-20 chars, letters/numbers/_"
              required
              minLength={4}
              maxLength={20}
            />
            {usernameStatus === 'checking' && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />
            )}
            {usernameStatus === 'free' && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success-600" />
            )}
            {usernameStatus === 'taken' && (
              <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger-600" />
            )}
          </div>
          {usernameStatus === 'taken' && (
            <p className="mt-1.5 text-xs font-medium text-danger-600">This username is already taken.</p>
          )}
        </div>

        <div>
          <label className="input-label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="input-label">Password</label>
          <div className="relative">
            <input
              className="input pr-11"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {PW_RULES.map((r) => {
              const ok = r.test(form.password);
              return (
                <li
                  key={r.label}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    ok ? 'text-success-600' : 'text-ink-400'
                  }`}
                >
                  {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
