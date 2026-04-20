import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './pageLayout.css';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Progress() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [subjectId, setSubjectId] = useState(String(user.id));
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    recordedAt: todayISO(),
    weightLb: '',
    bodyFatPct: '',
    benchPressLb: '',
    squatLb: '',
    cardioMinutes: '',
    notes: '',
  });

  const isCoachOrAdmin = user.role === 'coach' || user.role === 'admin';

  useEffect(() => {
    if (!isCoachOrAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const u = await apiFetch('/api/users');
        if (!cancelled) setAthletes(u.filter((x) => x.role === 'athlete'));
      } catch {
        /* coach with no permission still sees self progress only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCoachOrAdmin]);

  const activeUserId = Number(subjectId) || user.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiFetch(`/api/progress/${activeUserId}`);
        if (!cancelled) setEntries(rows);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load progress');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  const canEditForSubject = useMemo(() => {
    if (user.role === 'admin') return true;
    if (user.id === activeUserId) return true;
    if (user.role === 'coach') return athletes.some((a) => a.id === activeUserId);
    return false;
  }, [user, activeUserId, athletes]);

  async function submitEntry(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: {
          userId: activeUserId,
          recordedAt: form.recordedAt,
          weightLb: form.weightLb || null,
          bodyFatPct: form.bodyFatPct || null,
          benchPressLb: form.benchPressLb || null,
          squatLb: form.squatLb || null,
          cardioMinutes: form.cardioMinutes || null,
          notes: form.notes || null,
        },
      });
      setForm({
        recordedAt: todayISO(),
        weightLb: '',
        bodyFatPct: '',
        benchPressLb: '',
        squatLb: '',
        cardioMinutes: '',
        notes: '',
      });
      const rows = await apiFetch(`/api/progress/${activeUserId}`);
      setEntries(rows);
    } catch (err) {
      setError(err.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id) {
    if (!window.confirm('Delete this progress entry?')) return;
    setError('');
    try {
      await apiFetch(`/api/progress/${id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <div className="stack">
      <h1 className="page-title">Progress</h1>
      <p className="page-lead">Track performance metrics over time. Data loads from the Progress API.</p>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {isCoachOrAdmin ? (
        <label className="label" style={{ maxWidth: 360 }}>
          Athlete
          <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value={String(user.id)}>{user.full_name} (you)</option>
            {athletes.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.full_name} (#{a.id})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {canEditForSubject ? (
        <form className="form" style={{ maxWidth: 520 }} onSubmit={submitEntry}>
          <h2 className="page-title" style={{ fontSize: '1.1rem' }}>
            Log entry
          </h2>
          <div className="row">
            <label className="label" style={{ flex: '1 1 140px' }}>
              Date
              <input
                className="input"
                type="date"
                required
                value={form.recordedAt}
                onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 120px' }}>
              Weight (lb)
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.weightLb}
                onChange={(e) => setForm((f) => ({ ...f, weightLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 120px' }}>
              Body fat %
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.bodyFatPct}
                onChange={(e) => setForm((f) => ({ ...f, bodyFatPct: e.target.value }))}
              />
            </label>
          </div>
          <div className="row">
            <label className="label" style={{ flex: '1 1 120px' }}>
              Bench (lb)
              <input
                className="input"
                type="number"
                value={form.benchPressLb}
                onChange={(e) => setForm((f) => ({ ...f, benchPressLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 120px' }}>
              Squat (lb)
              <input
                className="input"
                type="number"
                value={form.squatLb}
                onChange={(e) => setForm((f) => ({ ...f, squatLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 120px' }}>
              Cardio (min)
              <input
                className="input"
                type="number"
                value={form.cardioMinutes}
                onChange={(e) => setForm((f) => ({ ...f, cardioMinutes: e.target.value }))}
              />
            </label>
          </div>
          <label className="label">
            Notes
            <textarea className="textarea" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </form>
      ) : (
        <p className="muted">You can view this athlete but not log entries for them.</p>
      )}

      <ul className="list">
        {entries.length === 0 ? (
          <li className="muted">No entries for this athlete yet.</li>
        ) : (
          entries.map((p) => (
            <li key={p.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{p.recorded_at?.slice?.(0, 10) || p.recorded_at}</strong>
                  <div className="muted" style={{ marginTop: '0.35rem' }}>
                    {[p.weight_lb != null && `${p.weight_lb} lb`, p.bench_press_lb != null && `bench ${p.bench_press_lb}`, p.squat_lb != null && `squat ${p.squat_lb}`, p.cardio_minutes != null && `${p.cardio_minutes} min cardio`]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                  {p.notes ? <p style={{ margin: '0.5rem 0 0' }}>{p.notes}</p> : null}
                </div>
                {canEditForSubject && (user.role !== 'athlete' || p.user_id === user.id) ? (
                  <button type="button" className="btn btn-danger" onClick={() => deleteEntry(p.id)}>
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
