import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  HiOutlineEye,
  HiOutlineTableCells,
  HiOutlineFunnel,
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

const rateColor = (rate) => {
  if (rate < 0.3) return 'var(--color-danger)';
  if (rate < 0.6) return 'var(--color-warning)';
  return 'var(--color-success)';
};

const SlicesTab = ({ audit }) => {
  const perAttribute = audit.sliceResults?.perAttribute || {};
  const intersectional = audit.sliceResults?.intersectional || [];
  const attrKeys = Object.keys(perAttribute);
  const [selectedAttr, setSelectedAttr] = useState(attrKeys[0] || '');

  const chartData = useMemo(() => {
    const slices = perAttribute[selectedAttr] || [];
    return slices.map((s) => ({
      group: s.group?.length > 16 ? s.group.slice(0, 14) + '…' : s.group,
      fullGroup: s.group,
      positiveRate: s.positiveRate,
      count: s.count,
      deviation: s.deviation,
    }));
  }, [perAttribute, selectedAttr]);

  const worstSlices = useMemo(() => {
    const all = [];
    for (const slices of Object.values(perAttribute)) {
      for (const s of slices) all.push(s);
    }
    return all.sort((a, b) => a.positiveRate - b.positiveRate).slice(0, 5);
  }, [perAttribute]);

  return (
    <div className="tab-slices">
      {/* Worst slices alert */}
      {worstSlices.length > 0 && (
        <motion.div className="worst-slices" custom={0} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div className="section-header">
              <HiOutlineFunnel />
              <h3>Most Disadvantaged Groups</h3>
            </div>
            <div className="worst-slices__grid">
              {worstSlices.map((s, i) => (
                <div key={i} className="worst-slice-chip">
                  <span className="worst-slice-chip__name">{s.group}</span>
                  <span className="worst-slice-chip__attr">{s.attribute}</span>
                  <span className="worst-slice-chip__rate" style={{ color: rateColor(s.positiveRate) }}>
                    {(s.positiveRate * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Attribute selector */}
      {attrKeys.length > 1 && (
        <motion.div className="attr-selector" custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <span className="attr-selector__label">Attribute</span>
          <div className="attr-selector__pills">
            {attrKeys.map((a) => (
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

      {/* Bar chart */}
      {chartData.length > 0 && (
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="chart-card chart-card--tall">
            <div className="section-header">
              <HiOutlineEye />
              <h3>Positive Outcome Rate — {selectedAttr}</h3>
              <Badge variant="default" size="sm">{chartData.length} groups</Badge>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 40)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} />
                <YAxis type="category" dataKey="group" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="positiveRate" name="Positive Rate" radius={[0, 6, 6, 0]} barSize={18}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Intersectional slices table */}
      {intersectional.length > 0 && (
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Card padding="none">
            <div className="section-header" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <HiOutlineTableCells />
              <h3>Intersectional Analysis</h3>
              <Badge variant="default" size="sm">{intersectional.length} slices</Badge>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="slice-table">
                <thead>
                  <tr>
                    <th>Intersection</th>
                    <th>Count</th>
                    <th>Positive Rate</th>
                    <th>Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {intersectional.slice(0, 20).map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.slice}</td>
                      <td>{s.count}</td>
                      <td style={{ color: rateColor(s.positiveRate) }}>{(s.positiveRate * 100).toFixed(1)}%</td>
                      <td>
                        <div className="slice-rate-bar">
                          <div className="slice-rate-bar__track">
                            <div className="slice-rate-bar__fill" style={{ width: `${s.positiveRate * 100}%`, background: rateColor(s.positiveRate) }} />
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
    </div>
  );
};

export default SlicesTab;
