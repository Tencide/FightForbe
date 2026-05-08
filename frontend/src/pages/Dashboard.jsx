import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { Sparkline } from '../components/Charts';
import './pageLayout.css';
import './Dashboard.css';

function fmtDate(s) {
  if (!s) return '';
  const d = String(s).slice(0, 10);
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [progress, setProgress] = useState([]);
  const [meals, setMeals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, p, m, msg] = await Promise.all([
          apiFetch('/api/workouts').catch(() => []),
          apiFetch(`/api/progress/${user.id}`).catch(() => []),
          apiFetch('/api/meals').catch(() => []),
          apiFetch('/api/messages').catch(() => []),
        ]);
        if (!cancelled) {
          setWorkouts(w);
          setProgress(p);
          setMeals(m);
          setMessages(msg);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const latest = progress[0];
  const weightSeries = [...progress]
    .reverse()
    .map((p) => Number(p.weight_lb))
    .filter((v) => !Number.isNaN(v));
  const benchSeries = [...progress]
    .reverse()
    .map((p) => Number(p.bench_press_lb))
    .filter((v) => !Number.isNaN(v));

  const conversations = Array.isArray(messages) ? messages : [];
  const unreadIsh = conversations.filter((c) => c.last && c.last.sender_id !== user.id).length;

  const targetMeal = meals[0];

  return (
    <div className="stack fade-up">
      <header className="page-header with-actions">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="page-title" style={{ fontSize: '1.9rem' }}>
            Welcome back, {user.full_name?.split(' ')[0] || 'athlete'}
          </h1>
          <p className="page-lead">
            Your training hub — open today's plan, log a check-in, message your coach.
          </p>
        </div>
        <Link to="/progress" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Log progress
        </Link>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}

      <section className="dash-metrics">
        <div className="metric">
          <span className="metric-label">Active workouts</span>
          <span className="metric-value">{loading ? '—' : workouts.length}</span>
          <span className="metric-meta">Plans assigned to you</span>
          <Link to="/workouts" className="metric-link">
            Open <Icon name="chevronRight" size={14} />
          </Link>
          <div className="metric-accent" />
        </div>

        <div className="metric">
          <span className="metric-label">Latest weight</span>
          <span className="metric-value">
            {latest?.weight_lb != null ? `${latest.weight_lb}` : '—'}
            <span className="metric-unit">lb</span>
          </span>
          <span className="metric-meta">
            {latest ? `Logged ${fmtDate(latest.recorded_at)}` : 'No entries yet'}
          </span>
          <Sparkline values={weightSeries} width={140} height={36} color="#f4b942" />
        </div>

        <div className="metric">
          <span className="metric-label">Top bench</span>
          <span className="metric-value">
            {benchSeries.length ? `${Math.max(...benchSeries)}` : '—'}
            <span className="metric-unit">lb</span>
          </span>
          <span className="metric-meta">
            {benchSeries.length ? `Across ${benchSeries.length} entries` : 'No entries yet'}
          </span>
          <Sparkline values={benchSeries} width={140} height={36} color="#38bdf8" />
        </div>

        <div className="metric">
          <span className="metric-label">Coach inbox</span>
          <span className="metric-value">{loading ? '—' : conversations.length}</span>
          <span className="metric-meta">
            {unreadIsh > 0
              ? `${unreadIsh} thread${unreadIsh === 1 ? '' : 's'} from your coach`
              : 'All caught up'}
          </span>
          <Link to="/chat" className="metric-link">
            Open <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      </section>

      <div className="dash-split">
        <section className="card stack">
          <div className="spread">
            <h2 className="section-title">Today's training</h2>
            <Link to="/workouts" className="btn-link">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : workouts.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                <Icon name="dumbbell" size={20} />
              </span>
              <h3>No workouts assigned yet</h3>
              <p>Your coach will drop in plans here. Check back after your next session.</p>
            </div>
          ) : (
            <ul className="list">
              {workouts.slice(0, 3).map((w) => (
                <li key={w.id} className="list-item">
                  <div className="spread">
                    <div>
                      <strong>{w.title}</strong>
                      <div className="muted" style={{ marginTop: 2 }}>
                        {w.description || 'No summary'}
                      </div>
                    </div>
                    <Link to="/workouts" className="btn btn-subtle btn-sm">
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack">
          <div className="spread">
            <h2 className="section-title">Nutrition target</h2>
            <Link to="/meals" className="btn-link">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : !targetMeal ? (
            <div className="empty">
              <span className="empty-icon">
                <Icon name="apple" size={20} />
              </span>
              <h3>No meal plan yet</h3>
              <p>Your coach will assign a meal target tied to your camp goals.</p>
            </div>
          ) : (
            <div className="stack-tight">
              <strong>{targetMeal.title}</strong>
              <div className="muted">{targetMeal.description || ''}</div>
              <div className="cluster" style={{ marginTop: 'var(--s-2)' }}>
                {targetMeal.target_calories != null && (
                  <span className="badge">{targetMeal.target_calories} kcal</span>
                )}
                {targetMeal.protein_g != null && (
                  <span className="badge">P {targetMeal.protein_g}g</span>
                )}
                {targetMeal.carbs_g != null && <span className="badge">C {targetMeal.carbs_g}g</span>}
                {targetMeal.fat_g != null && <span className="badge">F {targetMeal.fat_g}g</span>}
              </div>
            </div>
          )}
        </section>
      </div>

      {latest ? (
        <section className="card">
          <div className="spread">
            <div>
              <h2 className="section-title">Latest check-in</h2>
              <p className="muted" style={{ marginTop: 2 }}>
                {fmtDate(latest.recorded_at)}
              </p>
            </div>
            <Link to="/progress" className="btn-link">
              See history
            </Link>
          </div>
          <div className="dash-stat-row">
            {latest.weight_lb != null && <Stat label="Weight" value={`${latest.weight_lb} lb`} />}
            {latest.body_fat_pct != null && (
              <Stat label="Body fat" value={`${latest.body_fat_pct}%`} />
            )}
            {latest.bench_press_lb != null && (
              <Stat label="Bench" value={`${latest.bench_press_lb} lb`} />
            )}
            {latest.squat_lb != null && <Stat label="Squat" value={`${latest.squat_lb} lb`} />}
            {latest.cardio_minutes != null && (
              <Stat label="Cardio" value={`${latest.cardio_minutes} min`} />
            )}
          </div>
          {latest.notes ? (
            <p className="muted" style={{ marginTop: 'var(--s-3)' }}>
              "{latest.notes}"
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
    </div>
  );
}
