import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './pageLayout.css';

function fmtDate(s) {
  if (!s) return '';
  try {
    return new Date(String(s).slice(0, 10)).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return s;
  }
}

export default function CoachHome() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, w, m] = await Promise.all([
          apiFetch('/api/users').catch(() => []),
          apiFetch('/api/workouts').catch(() => []),
          apiFetch('/api/meals').catch(() => []),
        ]);
        if (!cancelled) {
          setUsers(u);
          setWorkouts(w);
          setMeals(m);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load coach data');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const athletes = useMemo(
    () =>
      users
        .filter((u) => u.role === 'athlete')
        .filter((u) => user.role === 'admin' || u.coach_id === user.id),
    [users, user]
  );

  const enriched = useMemo(() => {
    return athletes.map((a) => {
      const wCount = workouts.filter((w) => w.athlete_id === a.id).length;
      const mCount = meals.filter((m) => m.athlete_id === a.id).length;
      return { ...a, workouts: wCount, meals: mCount };
    });
  }, [athletes, workouts, meals]);

  return (
    <div className="stack fade-up">
      <header className="page-header">
        <p className="eyebrow">Coach</p>
        <h1 className="page-title">Your athletes</h1>
        <p className="page-lead">
          Welcome back, {user.full_name?.split(' ')[0]}. Quick view of athletes assigned to you and
          their latest plans.
        </p>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}

      <section className="dash-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s-4)' }}>
        <div className="metric">
          <span className="metric-label">Athletes</span>
          <span className="metric-value">{athletes.length}</span>
          <span className="metric-meta">Assigned to you</span>
        </div>
        <div className="metric">
          <span className="metric-label">Active workouts</span>
          <span className="metric-value">{workouts.length}</span>
          <span className="metric-meta">Across your roster</span>
        </div>
        <div className="metric">
          <span className="metric-label">Meal plans</span>
          <span className="metric-value">{meals.length}</span>
          <span className="metric-meta">Across your roster</span>
        </div>
        <div className="metric">
          <span className="metric-label">Quick action</span>
          <Link to="/workouts" className="btn btn-primary" style={{ marginTop: 4 }}>
            <Icon name="plus" size={14} />
            Assign workout
          </Link>
        </div>
      </section>

      <section className="card stack">
        <div className="spread">
          <h2 className="section-title">Athlete roster</h2>
          <div className="cluster">
            <Link to="/workouts" className="btn btn-subtle btn-sm">
              <Icon name="dumbbell" size={14} />
              Workouts
            </Link>
            <Link to="/meals" className="btn btn-subtle btn-sm">
              <Icon name="apple" size={14} />
              Meals
            </Link>
            <Link to="/chat" className="btn btn-subtle btn-sm">
              <Icon name="message" size={14} />
              Chat
            </Link>
          </div>
        </div>

        {enriched.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">
              <Icon name="users" size={20} />
            </span>
            <h3>No athletes assigned</h3>
            <p>An admin needs to assign athletes to you. Once assigned, they'll appear here.</p>
          </div>
        ) : (
          <ul className="list">
            {enriched.map((a) => (
              <li key={a.id} className="list-item">
                <div className="spread">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong>{a.full_name}</strong>
                    <div className="muted" style={{ marginTop: 2 }}>
                      {a.email} · joined {fmtDate(a.created_at)}
                    </div>
                  </div>
                  <div className="cluster">
                    <span className="badge">{a.workouts} workouts</span>
                    <span className="badge">{a.meals} meals</span>
                    <Link to={`/progress`} className="btn btn-subtle btn-sm">
                      <Icon name="trending" size={14} />
                      Progress
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
