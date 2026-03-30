import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineArrowUpRight,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Card, Badge, Button, Spinner } from '../../components/common';
import monitorService from '../../services/monitor.service';
import './DashboardHome.css';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SEVERITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      <p className="dash-chart-tooltip__label">{typeof label === 'string' ? label : new Date(label).toLocaleDateString()}</p>
      {payload.map((p, i) => (
        <p key={i} className="dash-chart-tooltip__value" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorService.getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || { datasets: 0, audits: 0, issues: 0, activeMonitors: 0 };
  const recentAudits = data?.recentAudits || [];
  const scoreTrend = (data?.scoreTrend || []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
  const severityBreakdown = data?.severityBreakdown || {};
  const pieData = Object.entries(severityBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const STAT_CARDS = [
    { icon: <HiOutlineCircleStack />, label: 'Datasets', value: stats.datasets, color: 'accent' },
    { icon: <HiOutlineCpuChip />, label: 'Audits Run', value: stats.audits, color: 'info' },
    { icon: <HiOutlineShieldCheck />, label: 'Issues Found', value: stats.issues, color: 'warning' },
    { icon: <HiOutlineBell />, label: 'Active Monitors', value: stats.activeMonitors, color: 'success' },
  ];

  if (loading) {
    return (
      <div className="dash-home" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="dash-home">
      <motion.div className="dash-home__header" initial="hidden" animate="visible" variants={fadeIn} custom={0}>
        <div>
          <h2 className="dash-home__title">Welcome back, {firstName}</h2>
          <p className="dash-home__subtitle">
            {stats.audits > 0
              ? `You have ${stats.audits} audit${stats.audits > 1 ? 's' : ''} across ${stats.datasets} dataset${stats.datasets > 1 ? 's' : ''}.`
              : 'Upload a dataset to start your first fairness audit.'}
          </p>
        </div>
        <Button icon={<HiOutlineArrowUpRight />} onClick={() => navigate('/dashboard/upload')}>
          New Upload
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="dash-home__stats">
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeIn} custom={i + 1}>
            <Card hover className="stat-card">
              <div className={`stat-card__icon stat-card__icon--${s.color}`}>{s.icon}</div>
              <div className="stat-card__body">
                <span className="stat-card__label">{s.label}</span>
                <span className="stat-card__value">{s.value}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div className="dash-home__grid" initial="hidden" animate="visible" variants={fadeIn} custom={5}>
        {/* Trend chart or empty recent audits */}
        <Card className="dash-home__recent">
          <div className="dash-home__card-header">
            <h3>Fairness Score Trend</h3>
            {scoreTrend.length > 0 && <Badge variant="accent">{scoreTrend.length} audits</Badge>}
          </div>
          {scoreTrend.length > 0 ? (
            <div className="dash-home__chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" name="Score" stroke="var(--color-accent)" fill="url(#scoreGrad)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dash-home__empty">
              <HiOutlineChartBar className="dash-home__empty-icon" />
              <p>Complete your first audit to see trend data.</p>
            </div>
          )}
        </Card>

        {/* Right side: severity breakdown or quick actions */}
        <Card className="dash-home__activity">
          {pieData.length > 0 ? (
            <>
              <div className="dash-home__card-header">
                <h3>Severity Breakdown</h3>
              </div>
              <div className="dash-home__pie-wrap">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} stroke="none">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-home__pie-legend">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="dash-home__pie-legend-item">
                      <span className="dash-home__pie-dot" style={{ background: SEVERITY_COLORS[entry.name] }} />
                      <span>{entry.name}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-home__card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="dash-home__actions-list">
                <button className="action-item" onClick={() => navigate('/dashboard/upload')}>
                  <span className="action-item__icon"><HiOutlineCircleStack /></span>
                  <span className="action-item__text">
                    <strong>Upload Dataset</strong>
                    <small>CSV, JSON, or Google Sheets</small>
                  </span>
                </button>
                <button className="action-item" onClick={() => navigate('/dashboard/upload')}>
                  <span className="action-item__icon"><HiOutlineCpuChip /></span>
                  <span className="action-item__text">
                    <strong>Upload Model</strong>
                    <small>ONNX, TensorFlow, scikit-learn</small>
                  </span>
                </button>
                <button className="action-item" onClick={() => navigate('/dashboard/datasets')}>
                  <span className="action-item__icon"><HiOutlineShieldCheck /></span>
                  <span className="action-item__text">
                    <strong>View Datasets</strong>
                    <small>Manage your uploaded datasets</small>
                  </span>
                </button>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Recent Audits */}
      {recentAudits.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={6}>
          <Card className="dash-home__audits-table">
            <div className="dash-home__card-header">
              <h3>Recent Audits</h3>
              <Button variant="ghost" size="xs" onClick={() => navigate('/dashboard/audits')}>View All</Button>
            </div>
            <div className="dash-home__table-wrap">
              <table className="dash-home__table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Score</th>
                    <th>Severity</th>
                    <th>Use Case</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((a) => (
                    <tr key={a._id}>
                      <td className="dash-home__table-name">{a.datasetName}</td>
                      <td>
                        <span className={`dash-home__score dash-home__score--${a.severity || 'low'}`}>
                          {a.score != null ? a.score.toFixed(0) : '—'}
                        </span>
                      </td>
                      <td><Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'success'} size="sm">{a.severity || '—'}</Badge></td>
                      <td className="dash-home__table-uc">{a.useCase || '—'}</td>
                      <td className="dash-home__table-date">{new Date(a.completedAt).toLocaleDateString()}</td>
                      <td><Button variant="ghost" size="xs" onClick={() => navigate(`/dashboard/audits/${a._id}`)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;
