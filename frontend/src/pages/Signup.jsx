import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { apiFetch, setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './pageLayout.css';
import './AuthLayout.css';

export default function Signup() {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        token: null,
      });
      setToken(data.token);
      localStorage.setItem('fightforge_user', JSON.stringify(data.user));
      window.location.assign('/dashboard');
    } catch (err) {
      let msg = err.message || 'Signup failed';
      if (import.meta.env.DEV && /could not reach|failed to fetch|load failed|network/i.test(msg)) {
        msg += ' — Is the API running? From repo root: cd backend && npm start (default http://127.0.0.1:5000).';
      }
      if (
        import.meta.env.PROD &&
        typeof window !== 'undefined' &&
        (window.location.hostname.endsWith('.vercel.app') || window.location.hostname === 'vercel.app') &&
        /could not reach|failed to fetch|load failed|network|not configured|html instead of json|cors/i.test(msg)
      ) {
        msg +=
          ' See docs/VERCEL.md — you need VITE_API_BASE (or an /api rewrite) plus CORS_ORIGIN on your API matching this site.';
      }
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell fade-up">
      <div className="auth-card">
        <p className="eyebrow">Join the camp</p>
        <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
          Create your account
        </h1>
        <p className="muted">
          You'll start as an athlete. A coach can be assigned by your admin afterwards.
        </p>

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 'var(--s-3)', maxWidth: 'unset' }}>
          <label className="label">
            Full name
            <input
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Tyson Fury"
              value={form.fullName}
              onChange={update('fullName')}
              required
              minLength={2}
            />
          </label>
          <label className="label">
            Email
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update('password')}
              required
              minLength={6}
            />
          </label>
          <label className="label">
            Confirm password
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Type it again"
              value={form.confirm}
              onChange={update('confirm')}
              required
            />
          </label>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
            {!loading && <Icon name="arrowRight" size={16} />}
          </button>
        </form>
      </div>

      <div className="auth-aside">
        <p className="muted" style={{ margin: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
