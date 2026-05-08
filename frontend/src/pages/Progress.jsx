import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { LineChart } from '../components/Charts';
import './pageLayout.css';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  recordedAt: todayISO(),
  weightLb: '',
  bodyFatPct: '',
  benchPressLb: '',
  squatLb: '',
  cardioMinutes: '',
  notes: '',
};

const SERIES = [
  { key: 'weight_lb', label: 'Weight', color: '#f4b942', unit: 'lb' },
  { key: 'bench_press_lb', label: 'Bench', color: '#38bdf8', unit: 'lb' },
  { key: 'squat_lb', label: 'Squat', color: '#a78bfa', unit: 'lb' },
  { key: 'cardio_minutes', label: 'Cardio', color: '#4ade80', unit: 'min' },
];

function fmtDate(s) {
  if (!s) return '';
  const d = String(s).slice(0, 10);
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export default function Progress() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [subjectId, setSubjectId] = useState(String(user.id));
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeMetric, setActiveMetric] = useState('weight_lb');
  const [form, setForm] = useState(EMPTY_FORM);

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
      setForm(EMPTY_FORM);
      setShowForm(false);
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

  const chartData = useMemo(() => {
    const sorted = [...entries].sort((a, b) =>
      String(a.recorded_at).localeCompare(String(b.recorded_at))
    );
    const meta = SERIES.find((s) => s.key === activeMetric) || SERIES[0];
    const data = sorted
      .map((e) => {
        const v = e[meta.key];
        if (v == null) return null;
        const t = new Date(String(e.recorded_at).slice(0, 10)).getTime();
        return Number.isNaN(t) ? null : { x: t, y: Number(v) };
      })
      .filter(Boolean);
    const labels = sorted
      .filter((e) => e[meta.key] != null)
      .map((e) => fmtDate(e.recorded_at));
    const decimated = labels.length > 6
      ? labels.filter((_, i, a) => i === 0 || i === a.length - 1 || i % Math.ceil(a.length / 6) === 0)
      : labels;
    return { meta, data, labels: decimated };
  }, [entries, activeMetric]);

  return (
    <div className="stack fade-up">
      <header className="page-header with-actions">
        <div>
          <p className="eyebrow">Progress</p>
          <h1 className="page-title">Performance trends</h1>
          <p className="page-lead">
            Track strength, conditioning, and body comp over time. Trends update on every save.
          </p>
        </div>
        {canEditForSubject ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            <Icon name={showForm ? 'x' : 'plus'} size={16} />
            {showForm ? 'Cancel' : 'New entry'}
          </button>
        ) : null}
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}

      {isCoachOrAdmin ? (
        <label className="label" style={{ maxWidth: 360 }}>
          Athlete
          <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value={String(user.id)}>{user.full_name} (you)</option>
            {athletes.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.full_name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <section className="card stack">
        <div className="spread">
          <h2 className="section-title">{chartData.meta.label} over time</h2>
          <div className="cluster">
            {SERIES.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`tab ${activeMetric === s.key ? 'is-active' : ''}`}
                onClick={() => setActiveMetric(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <LineChart
          series={[{ label: chartData.meta.label, color: chartData.meta.color, data: chartData.data }]}
          xLabels={chartData.labels}
          height={260}
        />
      </section>

      {canEditForSubject && showForm ? (
        <form className="form-card fade-up" onSubmit={submitEntry}>
          <h2 className="section-title">Log entry</h2>
          <div className="row">
            <label className="label" style={{ flex: '1 1 160px' }}>
              Date
              <input
                className="input"
                type="date"
                required
                value={form.recordedAt}
                onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 130px' }}>
              Weight (lb)
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="185.0"
                value={form.weightLb}
                onChange={(e) => setForm((f) => ({ ...f, weightLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 130px' }}>
              Body fat %
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="14.5"
                value={form.bodyFatPct}
                onChange={(e) => setForm((f) => ({ ...f, bodyFatPct: e.target.value }))}
              />
            </label>
          </div>
          <div className="row">
            <label className="label" style={{ flex: '1 1 130px' }}>
              Bench (lb)
              <input
                className="input"
                type="number"
                placeholder="225"
                value={form.benchPressLb}
                onChange={(e) => setForm((f) => ({ ...f, benchPressLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 130px' }}>
              Squat (lb)
              <input
                className="input"
                type="number"
                placeholder="315"
                value={form.squatLb}
                onChange={(e) => setForm((f) => ({ ...f, squatLb: e.target.value }))}
              />
            </label>
            <label className="label" style={{ flex: '1 1 130px' }}>
              Cardio (min)
              <input
                className="input"
                type="number"
                placeholder="30"
                value={form.cardioMinutes}
                onChange={(e) => setForm((f) => ({ ...f, cardioMinutes: e.target.value }))}
              />
            </label>
          </div>
          <label className="label">
            Notes
            <textarea
              className="textarea"
              placeholder="How did the session feel? Cuts, sleep, soreness…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="cluster">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save entry'}
            </button>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={() => {
                setForm(EMPTY_FORM);
                setShowForm(false);
              }}
            >
              Discard
            </button>
          </div>
        </form>
      ) : !canEditForSubject ? (
        <p className="muted">You can view this athlete but not log entries for them.</p>
      ) : null}

      <h2 className="section-title">History</h2>

      {entries.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">
            <Icon name="trending" size={20} />
          </span>
          <h3>No progress entries yet</h3>
          <p>Log your first check-in to start building a trendline.</p>
        </div>
      ) : (
        <ul className="list">
          {entries.map((p) => (
            <li key={p.id} className="list-item">
              <div className="spread">
                <div style={{ minWidth: 0 }}>
                  <div className="cluster" style={{ marginBottom: 4 }}>
                    <Icon name="calendar" size={14} color="var(--text-dim)" />
                    <strong>{fmtDate(p.recorded_at)}</strong>
                  </div>
                  <div className="muted">
                    {[
                      p.weight_lb != null && `${p.weight_lb} lb`,
                      p.body_fat_pct != null && `${p.body_fat_pct}% bf`,
                      p.bench_press_lb != null && `bench ${p.bench_press_lb}`,
                      p.squat_lb != null && `squat ${p.squat_lb}`,
                      p.cardio_minutes != null && `${p.cardio_minutes} min cardio`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                  {p.notes ? (
                    <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic' }}>"{p.notes}"</p>
                  ) : null}
                </div>
                {canEditForSubject && (user.role !== 'athlete' || p.user_id === user.id) ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteEntry(p.id)}
                    title="Delete entry"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
