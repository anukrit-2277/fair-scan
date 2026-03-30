import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineTrash,
  HiOutlinePlayPause,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChartBarSquare,
  HiOutlineSignal,
} from 'react-icons/hi2';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, Button, Badge, Spinner } from '../../components/common';
import { fetchMonitors, refreshMonitor, removeMonitor } from './monitorSlice';
import monitorService from '../../services/monitor.service';
import toast from 'react-hot-toast';
import './MonitoringPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

const SEVERITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="mon-tooltip">
      <p className="mon-tooltip__date">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>Score: <strong>{Number(p.value).toFixed(1)}</strong></p>
      ))}
    </div>
  );
};

const MonitoringPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: monitors, loading } = useSelector((s) => s.monitors);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMonitors());
  }, [dispatch]);

  const handleRefresh = async (id) => {
    setRefreshingId(id);
    try {
      await dispatch(refreshMonitor(id)).unwrap();
      toast.success('Monitor refreshed');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Refresh failed');
    }
    setRefreshingId(null);
  };

  const handleToggle = async (id) => {
    try {
      await monitorService.toggle(id);
      dispatch(fetchMonitors());
      toast.success('Monitor toggled');
    } catch (err) {
      toast.error('Toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this monitor?')) return;
    try {
      await dispatch(removeMonitor(id)).unwrap();
      toast.success('Monitor deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAck = async (monitorId, alertId) => {
    try {
      await monitorService.acknowledgeAlert(monitorId, alertId);
      dispatch(fetchMonitors());
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const totalAlerts = monitors.reduce((s, m) => s + m.alerts?.filter((a) => !a.acknowledged).length, 0);

  return (
    <div className="monitoring-page">
      <motion.div className="monitoring-page__header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <div>
          <h2>Monitoring</h2>
          <p>Track fairness drift and receive alerts for your audited datasets.</p>
        </div>
        <div className="monitoring-page__header-actions">
          {totalAlerts > 0 && <Badge variant="danger">{totalAlerts} unread alert{totalAlerts > 1 ? 's' : ''}</Badge>}
        </div>
      </motion.div>

      {loading && !monitors.length ? (
        <div className="monitoring-page__loader"><Spinner size="lg" /></div>
      ) : !monitors.length ? (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <Card className="monitoring-page__empty">
            <HiOutlineSignal style={{ fontSize: '2.5rem', opacity: 0.2 }} />
            <h3>No monitors yet</h3>
            <p>Complete a fairness audit, then enable monitoring from the audit dashboard's Mitigation tab or use the API.</p>
            <Button onClick={() => navigate('/dashboard/audits')}>Go to Audits</Button>
          </Card>
        </motion.div>
      ) : (
        <div className="monitoring-page__list">
          {monitors.map((mon, i) => {
            const expanded = expandedId === mon._id;
            const snapshots = mon.snapshots || [];
            const latest = snapshots[snapshots.length - 1];
            const unacked = (mon.alerts || []).filter((a) => !a.acknowledged);
            const chartData = snapshots.map((s, idx) => ({
              index: idx + 1,
              score: s.fairnessScore,
              date: new Date(s.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            }));

            return (
              <motion.div key={mon._id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
                <Card className={`monitor-card ${!mon.active ? 'monitor-card--paused' : ''}`}>
                  <div className="monitor-card__top" onClick={() => setExpandedId(expanded ? null : mon._id)}>
                    <div className="monitor-card__info">
                      <div className="monitor-card__status-dot" data-active={mon.active} />
                      <div>
                        <h4>{mon.datasetName || 'Monitor'}</h4>
                        <span className="monitor-card__meta">{mon.useCase || 'general'} · {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="monitor-card__stats">
                      {latest && (
                        <>
                          <div className="monitor-card__score" data-severity={latest.severity}>{latest.fairnessScore?.toFixed(0)}</div>
                          <Badge variant={latest.severity === 'critical' || latest.severity === 'high' ? 'danger' : latest.severity === 'medium' ? 'warning' : 'success'} size="sm">{latest.severity}</Badge>
                        </>
                      )}
                      {unacked.length > 0 && <Badge variant="danger" size="sm"><HiOutlineBell style={{ fontSize: 12 }} /> {unacked.length}</Badge>}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        className="monitor-card__expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="monitor-card__actions">
                          <Button variant="ghost" size="xs" icon={<HiOutlineArrowPath className={refreshingId === mon._id ? 'spin-anim' : ''} />} onClick={() => handleRefresh(mon._id)} disabled={refreshingId === mon._id}>
                            Refresh
                          </Button>
                          <Button variant="ghost" size="xs" icon={<HiOutlinePlayPause />} onClick={() => handleToggle(mon._id)}>
                            {mon.active ? 'Pause' : 'Resume'}
                          </Button>
                          <Button variant="ghost" size="xs" icon={<HiOutlineTrash />} onClick={() => handleDelete(mon._id)}>
                            Delete
                          </Button>
                          <Button variant="ghost" size="xs" icon={<HiOutlineChartBarSquare />} onClick={() => navigate(`/dashboard/audits/${mon.audit}`)}>
                            View Audit
                          </Button>
                        </div>

                        {/* Trend chart */}
                        {chartData.length > 1 && (
                          <div className="monitor-card__chart">
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                                <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} label={{ value: 'Snapshot', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-accent)' }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Alerts */}
                        {(mon.alerts || []).length > 0 && (
                          <div className="monitor-card__alerts">
                            <h5><HiOutlineBell /> Alerts ({mon.alerts.length})</h5>
                            <div className="monitor-alerts-list">
                              {[...mon.alerts].reverse().slice(0, 10).map((alert) => (
                                <div key={alert._id} className={`monitor-alert ${alert.acknowledged ? 'monitor-alert--acked' : ''}`}>
                                  <div className="monitor-alert__icon" data-severity={alert.severity}>
                                    <HiOutlineExclamationTriangle />
                                  </div>
                                  <div className="monitor-alert__body">
                                    <span className="monitor-alert__msg">{alert.message}</span>
                                    <span className="monitor-alert__time">{new Date(alert.createdAt).toLocaleString()}</span>
                                  </div>
                                  {!alert.acknowledged && (
                                    <Button variant="ghost" size="xs" icon={<HiOutlineCheckCircle />} onClick={() => handleAck(mon._id, alert._id)}>
                                      Ack
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Config */}
                        <div className="monitor-card__config">
                          <span>Threshold: <strong>{mon.config?.fairnessThreshold}</strong></span>
                          <span>Drift limit: <strong>{mon.config?.driftThreshold}pt</strong></span>
                          <span>Interval: <strong>{mon.config?.checkIntervalHours}h</strong></span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;
