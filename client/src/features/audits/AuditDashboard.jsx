import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell,
} from 'recharts';
import {
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
  HiOutlineScale,
  HiOutlineEye,
  HiOutlineSparkles,
  HiOutlineTableCells,
  HiOutlineCpuChip,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { fetchAudit, clearCurrentAudit } from './auditSlice';
import './AuditDashboard.css';

const SEVERITY_COLORS = {
  low: 'var(--color-severity-low)',
  medium: 'var(--color-severity-medium)',
  high: 'var(--color-severity-high)',
  critical: 'var(--color-severity-critical)',
};

const CHART_COLORS = ['#6C5CE7', '#4FC3F7', '#00D68F', '#FBBF24', '#FF6B6B', '#A29BFE', '#FF8A65', '#81C784'];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="audit-tooltip">
      <p className="audit-tooltip__label">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="audit-tooltip__row">
          <span className="audit-tooltip__dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="audit-tooltip__value">
            {typeof entry.value === 'number' ? (entry.value * 100).toFixed(1) + '%' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ScoreRing = ({ score, severity }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;

  return (
    <div className="score-ring-wrap">
      <svg className="score-ring-bg" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      </svg>
      <motion.svg
        className="score-ring-fg"
        viewBox="0 0 140 140"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </motion.svg>
      <div className="score-ring-label">
        <motion.div
          className="score-ring-label__value"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.div>
        <div className="score-ring-label__unit">Score</div>
      </div>
    </div>
  );
};

const AuditDashboard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: audit, loading } = useSelector((s) => s.audits);

  useEffect(() => {
    dispatch(fetchAudit(id));
    return () => dispatch(clearCurrentAudit());
  }, [id, dispatch]);

  // Poll while still analyzing
  useEffect(() => {
    if (!audit || audit.status !== 'analyzing') return;
    const timer = setInterval(() => dispatch(fetchAudit(id)), 3000);
    return () => clearInterval(timer);
  }, [audit?.status, id, dispatch]);

  const shapData = useMemo(() => {
    const vals = audit?.shapValues?.shapValues || [];
    return vals.slice(0, 10).map((v) => ({
      feature: v.feature?.length > 16 ? v.feature.slice(0, 14) + '...' : v.feature,
      fullName: v.feature,
      importance: v.importance,
      biasRisk: v.biasRisk,
    }));
  }, [audit]);

  const radarData = useMemo(() => {
    if (!audit?.fairnessMetrics) return [];
    const attrs = Object.keys(audit.fairnessMetrics);
    if (!attrs.length) return [];

    const firstAttr = audit.fairnessMetrics[attrs[0]];
    const metrics = [
      { metric: 'Dem. Parity', key: 'demographicParity' },
      { metric: 'Equal Opp.', key: 'equalOpportunity' },
      { metric: 'Pred. Parity', key: 'predictiveParity' },
      { metric: 'Disp. Impact', key: 'disparateImpact' },
    ];

    return metrics.map((m) => {
      const data = firstAttr[m.key];
      if (!data) return { metric: m.metric, score: 0.5 };
      if (m.key === 'disparateImpact') {
        return { metric: m.metric, score: data.ratio ?? 0.5 };
      }
      return { metric: m.metric, score: 1 - (data.disparity ?? 0.5) };
    });
  }, [audit]);

  const sliceChartData = useMemo(() => {
    if (!audit?.sliceResults?.perAttribute) return [];
    const all = [];
    for (const [, slices] of Object.entries(audit.sliceResults.perAttribute)) {
      for (const slice of slices) {
        all.push({
          group: `${slice.group}`,
          attribute: slice.attribute,
          positiveRate: slice.positiveRate,
          count: slice.count,
        });
      }
    }
    return all.slice(0, 20);
  }, [audit]);

  const metricPills = useMemo(() => {
    if (!audit?.fairnessMetrics) return [];
    const attrs = Object.keys(audit.fairnessMetrics);
    if (!attrs.length) return [];
    const first = audit.fairnessMetrics[attrs[0]];
    return [
      {
        name: 'Demographic Parity',
        value: first.demographicParity?.disparity,
        pass: first.demographicParity?.pass,
        format: (v) => (v * 100).toFixed(1) + '%',
        invert: true,
      },
      {
        name: 'Equal Opportunity',
        value: first.equalOpportunity?.disparity,
        pass: first.equalOpportunity?.pass,
        format: (v) => (v * 100).toFixed(1) + '%',
        invert: true,
      },
      {
        name: 'Predictive Parity',
        value: first.predictiveParity?.disparity,
        pass: first.predictiveParity?.pass,
        format: (v) => (v * 100).toFixed(1) + '%',
        invert: true,
      },
      {
        name: 'Disparate Impact',
        value: first.disparateImpact?.ratio,
        pass: first.disparateImpact?.pass,
        format: (v) => v.toFixed(3),
        invert: false,
      },
    ];
  }, [audit]);

  if (loading && !audit) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!audit) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
          Audit not found.
        </div>
      </Card>
    );
  }

  const summary = audit.biasSummary;
  const findings = summary?.findings || [];
  const compliance = summary?.complianceNotes || [];

  return (
    <div className="audit-dash">
      {/* Back + title — always visible */}
      <motion.div className="audit-dash__topbar" initial="hidden" animate="visible" variants={fadeUp}>
        <div className="audit-dash__topbar-left">
          <Button variant="ghost" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/dashboard/audits')}>
            Back
          </Button>
          <div className="audit-dash__title">
            <h2>{audit.datasetName || 'Audit Report'}</h2>
            <p>
              {audit.config?.useCase} · {audit.config?.protectedAttributes?.length || 0} protected attributes · {new Date(audit.completedAt || audit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Analyzing */}
        {audit.status === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="audit-analyzing">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <HiOutlineCpuChip style={{ fontSize: '2.5rem', color: 'var(--color-accent)' }} />
                </motion.div>
                <h3>Fairness Audit Running</h3>
                <p>Computing metrics, analyzing feature attributions, and generating the bias report. This may take a moment...</p>
                <Spinner size="sm" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Failed */}
        {audit.status === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <div className="audit-analyzing">
                <HiOutlineExclamationTriangle style={{ fontSize: '2.5rem', color: 'var(--color-danger)' }} />
                <h3>Audit Failed</h3>
                <p>{audit.error || 'An unexpected error occurred during the audit.'}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Pending */}
        {audit.status === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <div className="audit-analyzing">
                <Spinner size="lg" />
                <h3>Audit Queued</h3>
                <p>Your audit is queued and will start shortly.</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Completed — full dashboard */}
        {audit.status === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Score hero */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: 'var(--space-5)' }}>
              <Card>
                <div className="score-hero">
                  <ScoreRing score={audit.fairnessScore?.score ?? 0} severity={audit.severityScore} />
                  <div className="score-hero__info">
                    <div className="score-hero__severity">
                      <Badge variant={audit.severityScore === 'low' ? 'success' : audit.severityScore === 'critical' ? 'danger' : 'warning'} size="sm">
                        {audit.severityScore?.toUpperCase()} RISK
                      </Badge>
                      <Badge variant="default" size="sm">{audit.config?.useCase}</Badge>
                    </div>
                    <p className="score-hero__summary">
                      {summary?.executiveSummary || 'No summary available.'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Metric pills */}
            <motion.div className="metric-pills" custom={1} initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: 'var(--space-5)' }}>
              {metricPills.map((pill) => {
                if (pill.value == null) return null;
                const color = pill.pass ? 'var(--color-success)' : 'var(--color-danger)';
                const barPct = pill.invert ? Math.max(0, (1 - pill.value)) * 100 : pill.value * 100;
                return (
                  <Card key={pill.name} className="metric-pill">
                    <div className="metric-pill__header">
                      <span className="metric-pill__name">{pill.name}</span>
                      <Badge variant={pill.pass ? 'success' : 'danger'} size="sm">{pill.pass ? 'PASS' : 'FAIL'}</Badge>
                    </div>
                    <span className="metric-pill__value" style={{ color }}>{pill.format(pill.value)}</span>
                    <div className="metric-pill__bar">
                      <motion.div
                        className="metric-pill__bar-fill"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </Card>
                );
              })}
            </motion.div>

            {/* Charts grid */}
            <div className="audit-dash__charts">
              {/* SHAP Feature Attribution */}
              {shapData.length > 0 && (
                <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card">
                    <div className="chart-header">
                      <HiOutlineChartBar />
                      <h3>Feature Attribution</h3>
                      <Badge variant="default" size="sm">{shapData.length} features</Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} />
                        <YAxis type="category" dataKey="feature" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]} barSize={16}>
                          {shapData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.biasRisk === 'high' ? '#FF6B6B' : entry.biasRisk === 'medium' ? '#FBBF24' : CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Radar chart */}
              {radarData.length > 0 && (
                <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card">
                    <div className="chart-header">
                      <HiOutlineScale />
                      <h3>Fairness Radar</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#9BA3B5' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                        <Radar name="Fairness" dataKey="score" stroke="#6C5CE7" fill="#6C5CE7" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Slice breakdown bar chart */}
              {sliceChartData.length > 0 && (
                <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card chart-card--full">
                    <div className="chart-header">
                      <HiOutlineEye />
                      <h3>Positive Outcome Rate by Group</h3>
                      <Badge variant="default" size="sm">{sliceChartData.length} slices</Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(260, sliceChartData.length * 28)}>
                      <BarChart data={sliceChartData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} />
                        <YAxis type="category" dataKey="group" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="positiveRate" name="Positive Rate" radius={[0, 4, 4, 0]} barSize={14}>
                          {sliceChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Findings */}
              {findings.length > 0 && (
                <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card">
                    <div className="chart-header">
                      <HiOutlineExclamationTriangle />
                      <h3>Key Findings</h3>
                      <Badge variant="warning" size="sm">{findings.length}</Badge>
                    </div>
                    <div className="findings-list">
                      {findings.map((f, i) => (
                        <div key={i} className={`finding-item finding-item--${f.severity}`}>
                          <div className="finding-item__body">
                            <h4 className="finding-item__title">
                              <Badge variant={f.severity === 'critical' || f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'success'} size="sm">
                                {f.severity}
                              </Badge>
                              {' '}{f.title}
                            </h4>
                            <p className="finding-item__desc">{f.description}</p>
                            {f.recommendation && <p className="finding-item__rec">{f.recommendation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Compliance */}
              {compliance.length > 0 && (
                <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card">
                    <div className="chart-header">
                      <HiOutlineDocumentText />
                      <h3>Compliance Risk</h3>
                    </div>
                    <div className="compliance-list">
                      {compliance.map((c, i) => (
                        <div key={i} className="compliance-item">
                          <div className={`compliance-item__icon compliance-item__icon--${c.riskLevel}`}>
                            <HiOutlineShieldCheck />
                          </div>
                          <div className="compliance-item__body">
                            <h4>{c.regulation} <Badge variant={c.riskLevel === 'high' ? 'danger' : c.riskLevel === 'medium' ? 'warning' : 'success'} size="sm">{c.riskLevel}</Badge></h4>
                            <p>{c.relevance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Intersectional slices table */}
              {audit.sliceResults?.intersectional?.length > 0 && (
                <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card chart-card--full" padding="none">
                    <div className="chart-header" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <HiOutlineTableCells />
                      <h3>Intersectional Slices</h3>
                      <Badge variant="default" size="sm">{audit.sliceResults.intersectional.length}</Badge>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="slice-table">
                        <thead>
                          <tr>
                            <th>Slice</th>
                            <th>Count</th>
                            <th>Positive Rate</th>
                            <th>Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audit.sliceResults.intersectional.slice(0, 15).map((s, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.slice}</td>
                              <td>{s.count}</td>
                              <td>{(s.positiveRate * 100).toFixed(1)}%</td>
                              <td>
                                <div className="slice-rate-bar">
                                  <div className="slice-rate-bar__track">
                                    <div
                                      className="slice-rate-bar__fill"
                                      style={{
                                        width: `${s.positiveRate * 100}%`,
                                        background: s.positiveRate < 0.3 ? 'var(--color-danger)' : s.positiveRate < 0.6 ? 'var(--color-warning)' : 'var(--color-success)',
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* SHAP key findings */}
              {audit.shapValues?.keyFindings?.length > 0 && (
                <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="chart-card chart-card--full">
                    <div className="chart-header">
                      <HiOutlineSparkles />
                      <h3>AI Insights</h3>
                    </div>
                    <div className="findings-list">
                      {audit.shapValues.keyFindings.map((f, i) => (
                        <div key={i} className="finding-item finding-item--medium">
                          <div className="finding-item__body">
                            <p className="finding-item__desc" style={{ margin: 0 }}>{f}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditDashboard;
