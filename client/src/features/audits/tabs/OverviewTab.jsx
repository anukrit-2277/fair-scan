import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { Card, Badge } from '../../../components/common';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

const SEVERITY_COLORS = {
  low: 'var(--color-severity-low)',
  medium: 'var(--color-severity-medium)',
  high: 'var(--color-severity-high)',
  critical: 'var(--color-severity-critical)',
};

const ScoreRing = ({ score, severity }) => {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;

  return (
    <div className="score-ring-wrap">
      <svg className="score-ring-bg" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
      </svg>
      <motion.svg className="score-ring-fg" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </motion.svg>
      <div className="score-ring-label">
        <motion.div
          className="score-ring-label__value"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {score}
        </motion.div>
        <div className="score-ring-label__unit">/ 100</div>
      </div>
    </div>
  );
};

const OverviewTab = ({ audit }) => {
  const summary = audit.biasSummary;
  const findings = summary?.findings || [];

  const metricPills = useMemo(() => {
    if (!audit?.fairnessMetrics) return [];
    const attrs = Object.keys(audit.fairnessMetrics);
    if (!attrs.length) return [];
    const first = audit.fairnessMetrics[attrs[0]];
    return [
      { name: 'Demographic Parity', value: first.demographicParity?.disparity, pass: first.demographicParity?.pass, format: (v) => (v * 100).toFixed(1) + '%', invert: true },
      { name: 'Equal Opportunity', value: first.equalOpportunity?.disparity, pass: first.equalOpportunity?.pass, format: (v) => (v * 100).toFixed(1) + '%', invert: true },
      { name: 'Predictive Parity', value: first.predictiveParity?.disparity, pass: first.predictiveParity?.pass, format: (v) => (v * 100).toFixed(1) + '%', invert: true },
      { name: 'Disparate Impact', value: first.disparateImpact?.ratio, pass: first.disparateImpact?.pass, format: (v) => v.toFixed(3), invert: false },
    ];
  }, [audit]);

  const statCards = useMemo(() => {
    const attrs = Object.keys(audit.fairnessMetrics || {});
    const passing = metricPills.filter((p) => p.pass).length;
    const failing = metricPills.filter((p) => p.value != null && !p.pass).length;
    return [
      { label: 'Protected Attributes', value: attrs.length, color: 'var(--color-accent)' },
      { label: 'Metrics Passing', value: passing, color: 'var(--color-success)' },
      { label: 'Metrics Failing', value: failing, color: failing > 0 ? 'var(--color-danger)' : 'var(--color-success)' },
      { label: 'Findings', value: findings.length, color: 'var(--color-warning)' },
    ];
  }, [audit, metricPills, findings]);

  return (
    <div className="tab-overview">
      {/* Score hero */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="score-hero-card">
          <div className="score-hero">
            <ScoreRing score={audit.fairnessScore?.score ?? 0} severity={audit.severityScore} />
            <div className="score-hero__info">
              <div className="score-hero__badges">
                <Badge variant={audit.severityScore === 'low' ? 'success' : audit.severityScore === 'critical' ? 'danger' : 'warning'} size="sm">
                  <HiOutlineShieldCheck style={{ marginRight: 4 }} />
                  {audit.severityScore?.toUpperCase()} RISK
                </Badge>
                <Badge variant="default" size="sm">{audit.config?.useCase}</Badge>
                <Badge variant="default" size="sm">{audit.config?.protectedAttributes?.length} attributes</Badge>
              </div>
              <p className="score-hero__summary">
                {summary?.executiveSummary || 'No AI summary available for this audit.'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick stat cards */}
      <motion.div className="overview-stats" custom={1} initial="hidden" animate="visible" variants={fadeUp}>
        {statCards.map((s, i) => (
          <Card key={s.label} className="stat-card" hover>
            <motion.span
              className="stat-card__value"
              style={{ color: s.color }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {s.value}
            </motion.span>
            <span className="stat-card__label">{s.label}</span>
          </Card>
        ))}
      </motion.div>

      {/* Metric pills */}
      <motion.div className="metric-pills" custom={2} initial="hidden" animate="visible" variants={fadeUp}>
        {metricPills.map((pill) => {
          if (pill.value == null) return null;
          const color = pill.pass ? 'var(--color-success)' : 'var(--color-danger)';
          const barPct = pill.invert ? Math.max(0, (1 - pill.value)) * 100 : pill.value * 100;
          return (
            <Card key={pill.name} className="metric-pill" hover>
              <div className="metric-pill__header">
                <span className="metric-pill__name">{pill.name}</span>
                <span className={`metric-pill__badge metric-pill__badge--${pill.pass ? 'pass' : 'fail'}`}>
                  {pill.pass ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
                  {pill.pass ? 'Pass' : 'Fail'}
                </span>
              </div>
              <span className="metric-pill__value" style={{ color }}>{pill.format(pill.value)}</span>
              <div className="metric-pill__bar">
                <motion.div
                  className="metric-pill__bar-fill"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* Key Findings preview */}
      {findings.length > 0 && (
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div className="section-header">
              <HiOutlineExclamationTriangle />
              <h3>Key Findings</h3>
              <Badge variant="warning" size="sm">{findings.length}</Badge>
            </div>
            <div className="findings-list">
              {findings.slice(0, 4).map((f, i) => (
                <div key={i} className={`finding-item finding-item--${f.severity}`}>
                  <div className="finding-item__body">
                    <h4 className="finding-item__title">
                      <Badge variant={f.severity === 'critical' || f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'success'} size="sm">
                        {f.severity}
                      </Badge>
                      {f.title}
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
    </div>
  );
};

export default OverviewTab;
