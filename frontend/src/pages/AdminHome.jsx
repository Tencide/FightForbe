import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './pageLayout.css';

const NEW_USER_FORM = {
  fullName: '',
  email: '',
  password: '',
  role: 'athlete',
  coachId: '',
};

export default function AdminHome() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState(NEW_USER_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function refresh() {
    try {
      const u = await apiFetch('/api/users');
      setUsers(u);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const coaches = useMemo(() => users.filter((u) => u.role === 'coach'), [users]);

  const filtered = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const counts = useMemo(
    () => ({
      all: users.length,
      athlete: users.filter((u) => u.role === 'athlete').length,
      coach: users.filter((u) => u.role === 'coach').length,
      admin: users.filter((u) => u.role === 'admin').length,
    }),
    [users]
  );

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: {
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          role: newUser.role,
          coachId: newUser.role === 'athlete' && newUser.coachId ? Number(newUser.coachId) : null,
        },
      });
      setNewUser(NEW_USER_FORM);
      setShowCreate(false);
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not create user');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEditForm({
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      coachId: u.coach_id ? String(u.coach_id) : '',
      password: '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id) {
    setBusy(true);
    setError('');
    try {
      const body = {};
      if (editForm.fullName !== undefined) body.fullName = editForm.fullName;
      if (editForm.email !== undefined) body.email = editForm.email;
      if (editForm.role !== undefined) body.role = editForm.role;
      if (editForm.password) body.password = editForm.password;
      body.coachId = editForm.role === 'athlete' && editForm.coachId ? Number(editForm.coachId) : null;
      await apiFetch(`/api/users/${id}`, { method: 'PUT', body });
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not save user');
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u) {
    if (u.id === user.id) {
      setError('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Delete ${u.full_name}? This is irreversible.`)) return;
    setBusy(true);
    try {
      await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack fade-up">
      <header className="page-header with-actions">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="page-title">User management</h1>
          <p className="page-lead">
            Welcome back, {user.full_name?.split(' ')[0]}. Manage roles, assign athletes to coaches,
            and provision accounts.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreate((v) => !v)}
        >
          <Icon name={showCreate ? 'x' : 'plus'} size={16} />
          {showCreate ? 'Cancel' : 'Add user'}
        </button>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}

      <section className="dash-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--s-4)' }}>
        <div className="metric">
          <span className="metric-label">All users</span>
          <span className="metric-value">{counts.all}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Athletes</span>
          <span className="metric-value" style={{ color: 'var(--role-athlete)' }}>{counts.athlete}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Coaches</span>
          <span className="metric-value" style={{ color: 'var(--role-coach)' }}>{counts.coach}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Admins</span>
          <span className="metric-value" style={{ color: 'var(--role-admin)' }}>{counts.admin}</span>
        </div>
      </section>

      {showCreate ? (
        <form className="form-card fade-up" onSubmit={createUser}>
          <h2 className="section-title">Create user</h2>
          <div className="row">
            <label className="label" style={{ flex: '2 1 240px' }}>
              Full name
              <input
                className="input"
                value={newUser.fullName}
                onChange={(e) => setNewUser((u) => ({ ...u, fullName: e.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label className="label" style={{ flex: '2 1 240px' }}>
              Email
              <input
                className="input"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                required
              />
            </label>
            <label className="label" style={{ flex: '1 1 160px' }}>
              Role
              <select
                className="select"
                value={newUser.role}
                onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
              >
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div className="row">
            <label className="label" style={{ flex: '1 1 240px' }}>
              Temporary password
              <input
                className="input"
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>
            {newUser.role === 'athlete' ? (
              <label className="label" style={{ flex: '1 1 240px' }}>
                Assign coach
                <select
                  className="select"
                  value={newUser.coachId}
                  onChange={(e) => setNewUser((u) => ({ ...u, coachId: e.target.value }))}
                >
                  <option value="">No coach yet</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="cluster">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={() => {
                setNewUser(NEW_USER_FORM);
                setShowCreate(false);
              }}
            >
              Discard
            </button>
          </div>
        </form>
      ) : null}

      <div className="cluster">
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'athlete', label: `Athletes (${counts.athlete})` },
          { id: 'coach', label: `Coaches (${counts.coach})` },
          { id: 'admin', label: `Admins (${counts.admin})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${filter === t.id ? 'is-active' : ''}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="list">
        {filtered.map((u) => {
          const editing = editingId === u.id;
          const coachName = u.coach_id ? coaches.find((c) => c.id === u.coach_id)?.full_name : null;
          return (
            <li key={u.id} className="list-item">
              {!editing ? (
                <div className="spread">
                  <div style={{ minWidth: 0 }}>
                    <div className="cluster" style={{ marginBottom: 4 }}>
                      <strong>{u.full_name}</strong>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    </div>
                    <div className="muted">
                      {u.email}
                      {u.role === 'athlete' && coachName ? ` · coach: ${coachName}` : ''}
                      {u.role === 'athlete' && !coachName ? ' · no coach yet' : ''}
                    </div>
                  </div>
                  <div className="cluster">
                    <button type="button" className="btn btn-subtle btn-sm" onClick={() => startEdit(u)}>
                      <Icon name="edit" size={14} />
                      Edit
                    </button>
                    {u.id !== user.id ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeUser(u)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.78rem' }}>(you)</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="stack-tight">
                  <div className="row">
                    <label className="label" style={{ flex: '2 1 200px' }}>
                      Full name
                      <input
                        className="input"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                      />
                    </label>
                    <label className="label" style={{ flex: '2 1 220px' }}>
                      Email
                      <input
                        className="input"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </label>
                    <label className="label" style={{ flex: '1 1 140px' }}>
                      Role
                      <select
                        className="select"
                        value={editForm.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                      >
                        <option value="athlete">Athlete</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                  </div>
                  <div className="row">
                    {editForm.role === 'athlete' ? (
                      <label className="label" style={{ flex: '1 1 220px' }}>
                        Coach
                        <select
                          className="select"
                          value={editForm.coachId}
                          onChange={(e) => setEditForm((f) => ({ ...f, coachId: e.target.value }))}
                        >
                          <option value="">No coach</option>
                          {coaches.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="label" style={{ flex: '1 1 220px' }}>
                      Reset password (optional)
                      <input
                        className="input"
                        type="text"
                        placeholder="Leave blank to keep"
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="cluster">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => saveEdit(u.id)}
                      disabled={busy}
                    >
                      <Icon name="check" size={14} />
                      Save
                    </button>
                    <button type="button" className="btn btn-subtle btn-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
