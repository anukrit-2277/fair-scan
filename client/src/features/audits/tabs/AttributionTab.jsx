import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
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

const RISK_COLORS = { high: '#FF6B6B', medium: '#FBBF24', low: '#00D68F', none: '#6C5CE7' };

const AttributionTab = ({ audit }) => {
  const shapData = useMemo(() => {
    const vals = audit?.shapValues?.shapValues || [];
    return vals.slice(0, 15).map((v) => ({
      feature: v.feature?.length > 20 ? v.feature.slice(0, 18) + '…' : v.feature,
      fullName: v.feature,
      importance: v.importance,
      biasRisk: v.biasRisk || 'none',
    }));
  }, [audit]);

  const keyFindings = audit?.shapValues?.keyFindings || [];
  const rawCorrelations = audit?.shapValues?.rawCorrelations || [];

  const highRisk = shapData.filter((d) => d.biasRisk === 'high');
  const medRisk = shapData.filter((d) => d.biasRisk === 'medium');

  return (
    <div className="tab-attribution">
      {/* Risk summary strip */}
      {(highRisk.length > 0 || medRisk.length > 0) && (
        <motion.div className="risk-summary" custom={0} initial="hidden" animate="visible" variants={fadeUp}>
          {highRisk.length > 0 && (
            <div className="risk-summary__item risk-summary__item--high">
              <HiOutlineExclamationTriangle />
              <span><strong>{highRisk.length}</strong> high-risk feature{highRisk.length > 1 ? 's' : ''}: {highRisk.map((f) => f.fullName).join(', ')}</span>
            </div>
          )}
          {medRisk.length > 0 && (
            <div className="risk-summary__item risk-summary__item--medium">
              <HiOutlineInformationCircle />
              <span><strong>{medRisk.length}</strong> medium-risk feature{medRisk.length > 1 ? 's' : ''}: {medRisk.map((f) => f.fullName).join(', ')}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* SHAP Chart */}
      {shapData.length > 0 && (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="chart-card chart-card--tall">
            <div className="section-header">
              <HiOutlineChartBar />
              <h3>Feature Attribution (SHAP-like)</h3>
              <Badge variant="default" size="sm">{shapData.length} features</Badge>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(320, shapData.length * 32)}>
              <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} />
                <YAxis type="category" dataKey="feature" width={130} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]} barSize={18}>
                  {shapData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.biasRisk] || RISK_COLORS.none} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {Object.entries(RISK_COLORS).map(([label, color]) => (
                <span key={label} className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: color }} />
                  {label === 'none' ? 'Low / None' : label} risk
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Correlation table */}
      {rawCorrelations.length > 0 && (
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Card padding="none">
            <div className="section-header" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <HiOutlineChartBar />
              <h3>Raw Correlation Values</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="slice-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Importance</th>
                    <th>Bias Risk</th>
                    <th>Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {rawCorrelations.slice(0, 20).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{c.feature}</td>
                      <td>{(c.importance * 100).toFixed(1)}%</td>
                      <td>
                        <Badge variant={c.biasRisk === 'high' ? 'danger' : c.biasRisk === 'medium' ? 'warning' : 'success'} size="sm">
                          {c.biasRisk || 'low'}
                        </Badge>
                      </td>
                      <td>
                        <div className="slice-rate-bar">
                          <div className="slice-rate-bar__track">
                            <div
                              className="slice-rate-bar__fill"
                              style={{ width: `${c.importance * 100}%`, background: RISK_COLORS[c.biasRisk] || RISK_COLORS.none }}
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

      {/* AI Key Findings */}
      {keyFindings.length > 0 && (
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div className="section-header">
              <HiOutlineSparkles />
              <h3>AI Insights</h3>
              <Badge variant="default" size="sm">Gemini</Badge>
            </div>
            <div className="ai-insights">
              {keyFindings.map((f, i) => (
                <motion.div
                  key={i}
                  className="ai-insight-item"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <span className="ai-insight-item__num">{i + 1}</span>
                  <p>{f}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AttributionTab;
