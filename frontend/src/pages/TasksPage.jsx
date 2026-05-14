import { tasksApi, aiApi } from '../api/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

export default function TasksPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResult, setAiResult]   = useState({});
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  // ── AI Suggest ───────────────────────────────────────
  const handleAiSuggest = async (taskId) => {
    setAiLoading(taskId);
    try {
      const res = await aiApi.suggest(taskId);
      setAiResult(prev => ({ ...prev, [taskId]: res.data }));
    } catch (err) {
      setError('AI failed — check your ANTHROPIC_API_KEY in .env');
    } finally {
      setAiLoading(null);
    }
  };

  // ── Load tasks on page open ──────────────────────────
  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getAll();
      setTasks(res.data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ── Create task ──────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const res = await tasksApi.create(form);
      setTasks([res.data, ...tasks]);
      setForm({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  // ── Update status ────────────────────────────────────
  const handleStatus = async (id, status) => {
    try {
      const res = await tasksApi.update(id, { status });
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  // ── Delete task ──────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await tasksApi.remove(id);
      setTasks(tasks.filter(t => t.id !== id));
      // also clear AI result for deleted task
      setAiResult(prev => { const n = {...prev}; delete n[id]; return n; });
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // ── Logout ───────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login'); };

  const priorityColor = {
    low: '#22c55e', medium: '#f59e0b', high: '#ef4444'
  };

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>AI Task Manager</h1>
          <p style={s.subtitle}>Welcome back, {user?.name} 👋</p>
        </div>
        <div style={s.headerRight}>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Task'}
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div style={s.error}>
          {error}
          <span style={{cursor:'pointer', marginLeft:'12px'}}
            onClick={() => setError('')}>✕</span>
        </div>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={{marginBottom:'16px', color:'#fff'}}>Create New Task</h3>
          <form onSubmit={handleCreate}>
            <input
              style={s.input}
              placeholder="Task title *"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
            />
            <textarea
              style={{...s.input, height:'80px', resize:'vertical'}}
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
            <select
              style={s.input}
              value={form.priority}
              onChange={e => setForm({...form, priority: e.target.value})}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
            <button style={s.addBtn} type="submit">Create Task</button>
          </form>
        </div>
      )}

      {/* STATS */}
      <div style={s.stats}>
        <div style={s.statBox}>
          <div style={s.statNum}>{tasks.length}</div>
          <div style={s.statLabel}>Total</div>
        </div>
        <div style={s.statBox}>
          <div style={{...s.statNum, color:'#f59e0b'}}>
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div style={s.statLabel}>In Progress</div>
        </div>
        <div style={s.statBox}>
          <div style={{...s.statNum, color:'#22c55e'}}>
            {tasks.filter(t => t.status === 'done').length}
          </div>
          <div style={s.statLabel}>Done</div>
        </div>
        <div style={s.statBox}>
          <div style={{...s.statNum, color:'#ef4444'}}>
            {tasks.filter(t => t.priority === 'high').length}
          </div>
          <div style={s.statLabel}>High Priority</div>
        </div>
      </div>

      {/* TASK LIST */}
      {loading ? (
        <div style={s.empty}>Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={s.empty}>
          <div style={{fontSize:'48px', marginBottom:'12px'}}>📝</div>
          <div>No tasks yet. Click "+ New Task" to get started!</div>
        </div>
      ) : (
        <div style={s.taskList}>
          {tasks.map(task => (
            <div key={task.id} style={{
              ...s.taskCard,
              borderLeft: `4px solid ${priorityColor[task.priority]}`
            }}>

              {/* Task title + delete */}
              <div style={s.taskHeader}>
                <h3 style={{
                  ...s.taskTitle,
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  opacity: task.status === 'done' ? 0.5 : 1
                }}>
                  {task.title}
                </h3>
                <button style={s.deleteBtn}
                  onClick={() => handleDelete(task.id)}>✕</button>
              </div>

              {/* Description */}
              {task.description && (
                <p style={s.taskDesc}>{task.description}</p>
              )}

              {/* Priority + Status */}
              <div style={s.taskFooter}>
                <span style={{
                  ...s.badge,
                  background: priorityColor[task.priority] + '22',
                  color: priorityColor[task.priority]
                }}>
                  {task.priority.toUpperCase()}
                </span>
                <select
                  style={s.statusSelect}
                  value={task.status}
                  onChange={e => handleStatus(task.id, e.target.value)}
                >
                  <option value="todo">📋 Todo</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="done">✅ Done</option>
                </select>
              </div>

              {/* ── AI SUGGEST BUTTON ── */}
              <button
                style={{
                  ...s.aiBtn,
                  background: aiLoading === task.id ? '#2d1b4e' : '#4c1d95',
                  opacity: aiLoading === task.id ? 0.7 : 1,
                  cursor: aiLoading === task.id ? 'wait' : 'pointer'
                }}
                onClick={() => handleAiSuggest(task.id)}
                disabled={aiLoading === task.id}
              >
                {aiLoading === task.id ? '🤖 Claude is thinking...' : '🤖 AI Suggest'}
              </button>

              {/* ── AI RESULT ── */}
              {aiResult[task.id] && (
                <div style={s.aiBox}>

                  {/* Subtasks */}
                  <div style={s.aiTitle}>📋 Subtasks</div>
                  {aiResult[task.id].subtasks?.map((sub, i) => (
                    <div key={i} style={s.aiItem}>
                      {i + 1}. {sub}
                    </div>
                  ))}

                  {/* Time estimate */}
                  {aiResult[task.id].estimated_hours && (
                    <div style={s.aiTime}>
                      ⏱️ Estimated time: {aiResult[task.id].estimated_hours} hours
                    </div>
                  )}

                  {/* Tip */}
                  {aiResult[task.id].tip && (
                    <div style={s.aiTip}>
                      💡 Tip: {aiResult[task.id].tip}
                    </div>
                  )}

                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ── STYLES ────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: '#0f0f13',
    padding: '32px',
    fontFamily: 'sans-serif',
    color: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: { fontSize: '28px', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: '14px' },
  headerRight: { display: 'flex', gap: '12px' },
  addBtn: {
    padding: '10px 20px',
    background: '#1e4d2b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  logoutBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#64748b',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  error: {
    background: '#fde8e8',
    color: '#c0392b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  formCard: {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    background: '#0f0f13',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },
  statBox: {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center'
  },
  statNum: { fontSize: '32px', fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  taskList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px'
  },
  taskCard: {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '20px'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  taskTitle: { fontSize: '16px', fontWeight: '700', margin: 0, flex: 1 },
  taskDesc: { color: '#64748b', fontSize: '13px', marginBottom: '12px' },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 0 0 8px'
  },
  taskFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '12px'
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700'
  },
  statusSelect: {
    background: '#0f0f13',
    border: '1px solid #2a2a3a',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  // ── AI styles ──────────────────────────────────────
  aiBtn: {
    width: '100%',
    marginTop: '14px',
    padding: '9px',
    background: '#4c1d95',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.3px'
  },
  aiBox: {
    marginTop: '12px',
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: '8px',
    padding: '14px'
  },
  aiTitle: {
    color: '#a78bfa',
    fontWeight: '700',
    fontSize: '11px',
    marginBottom: '8px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  aiItem: {
    color: '#c4b5fd',
    fontSize: '13px',
    padding: '5px 0',
    borderBottom: '1px solid rgba(124,58,237,0.1)',
    lineHeight: '1.5'
  },
  aiTime: {
    color: '#fbbf24',
    fontSize: '12px',
    marginTop: '10px',
    fontWeight: '600'
  },
  aiTip: {
    color: '#86efac',
    fontSize: '12px',
    marginTop: '8px',
    fontStyle: 'italic',
    lineHeight: '1.5'
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '80px 20px',
    fontSize: '16px'
  }
};