import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell,
} from 'recharts';
import {
  HiOutlineScale,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { Card, Badge } from '../../../components/common';
import ChartTooltip from '../ChartTooltip';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

const CHART_COLORS = ['#6C5CE7', '#4FC3F7', '#00D68F', '#FBBF24', '#FF6B6B', '#A29BFE', '#FF8A65', '#81C784'];

const METRIC_META = {
  demographicParity: { name: 'Demographic Parity', desc: 'Measures equal positive outcome rates across groups', key: 'disparity', format: (v) => (v * 100).toFixed(1) + '%', radarKey: 'disparity' },
  equalOpportunity: { name: 'Equal Opportunity', desc: 'Measures equal true positive rates', key: 'disparity', format: (v) => (v * 100).toFixed(1) + '%', radarKey: 'disparity' },
  predictiveParity: { name: 'Predictive Parity', desc: 'Measures equal precision across groups', key: 'disparity', format: (v) => (v * 100).toFixed(1) + '%', radarKey: 'disparity' },
  disparateImpact: { name: 'Disparate Impact', desc: 'Ratio of positive rates between groups (≥0.8 is fair)', key: 'ratio', format: (v) => v?.toFixed(3), radarKey: 'ratio' },
  representationGap: { name: 'Representation Gap', desc: 'Deviation in group representation from overall', key: 'maxGap', format: (v) => (v * 100).toFixed(1) + '%', radarKey: 'maxGap' },
};

const MetricsTab = ({ audit }) => {
  const attrs = Object.keys(audit.fairnessMetrics || {});
  const [selectedAttr, setSelectedAttr] = useState(attrs[0] || '');

  const currentMetrics = audit.fairnessMetrics?.[selectedAttr] || {};

  const radarData = useMemo(() => {
    return Object.entries(METRIC_META).map(([key, meta]) => {
      const data = currentMetrics[key];
      if (!data) return { metric: meta.name, score: 0.5 };
      if (key === 'disparateImpact') return { metric: meta.name, score: data.ratio ?? 0.5 };
      return { metric: meta.name, score: Math.max(0, 1 - (data[meta.radarKey] ?? 0.5)) };
    });
  }, [currentMetrics]);

  const groupRateData = useMemo(() => {
    const dp = currentMetrics.demographicParity;
    if (!dp?.groups) return [];
    return Object.entries(dp.groups).map(([group, rate]) => ({
      group: group.length > 14 ? group.slice(0, 12) + '…' : group,
      fullGroup: group,
      rate,
    }));
  }, [currentMetrics]);

  return (
    <div className="tab-metrics">
      {/* Attribute selector */}
      {attrs.length > 1 && (
        <motion.div className="attr-selector" custom={0} initial="hidden" animate="visible" variants={fadeUp}>
          <span className="attr-selector__label">Protected Attribute</span>
          <div className="attr-selector__pills">
            {attrs.map((a) => (
              <button
                key={a}
                className={`attr-pill ${selectedAttr === a ? 'attr-pill--active' : ''}`}
                onClick={() => setSelectedAttr(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Metric detail cards */}
      <motion.div className="metrics-grid" custom={1} initial="hidden" animate="visible" variants={fadeUp}>
        {Object.entries(METRIC_META).map(([key, meta]) => {
          const data = currentMetrics[key];
          if (!data) return null;
          const value = data[meta.key];
          const pass = data.pass;
          return (
            <Card key={key} className="metric-detail-card" hover>
              <div className="metric-detail-card__top">
                <span className="metric-detail-card__name">{meta.name}</span>
                <span className={`metric-pill__badge metric-pill__badge--${pass ? 'pass' : 'fail'}`}>
                  {pass ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
                  {pass ? 'Pass' : 'Fail'}
                </span>
              </div>
              <span className="metric-detail-card__value" style={{ color: pass ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {value != null ? meta.format(value) : '—'}
              </span>
              <p className="metric-detail-card__desc">{meta.desc}</p>
              {data.threshold != null && (
                <span className="metric-detail-card__threshold">
                  Threshold: {meta.format(data.threshold)}
                </span>
              )}
            </Card>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <div className="metrics-charts">
        {radarData.length > 0 && (
          <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="chart-card">
              <div className="section-header">
                <HiOutlineScale />
                <h3>Fairness Radar — {selectedAttr}</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#9BA3B5' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar name="Fairness" dataKey="score" stroke="#6C5CE7" fill="#6C5CE7" fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: '#6C5CE7', strokeWidth: 0 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {groupRateData.length > 0 && (
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="chart-card">
              <div className="section-header">
                <HiOutlineChartBar />
                <h3>Positive Rate by Group</h3>
                <Badge variant="default" size="sm">{groupRateData.length} groups</Badge>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupRateData} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#9BA3B5' }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} tick={{ fontSize: 11, fill: '#626D82' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="rate" name="Positive Rate" radius={[4, 4, 0, 0]} barSize={28}>
                    {groupRateData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MetricsTab;
