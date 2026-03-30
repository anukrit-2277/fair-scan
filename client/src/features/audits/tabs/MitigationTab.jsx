import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowPath,
  HiOutlineScale,
  HiOutlineTrash,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles,
  HiOutlineClock,
} from 'react-icons/hi2';
import { Card, Badge, Button, Spinner } from '../../../components/common';
import auditService from '../../../services/audit.service';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

const STRATEGIES = [
  {
    id: 'resample',
    name: 'Resampling',
    desc: 'Balance group representation by over-sampling underrepresented groups or under-sampling overrepresented ones.',
    icon: <HiOutlineArrowPath />,
    color: '#6C5CE7',
  },
  {
    id: 'reweight',
    name: 'Reweighting',
    desc: 'Assign higher sample weights to disadvantaged group examples to equalise their impact during model training.',
    icon: <HiOutlineScale />,
    color: '#4FC3F7',
  },
  {
    id: 'proxy_removal',
    name: 'Proxy Removal',
    desc: 'Identify and remove proxy columns that encode protected attributes, reducing indirect discrimination.',
    icon: <HiOutlineTrash />,
    color: '#FF8A65',
  },
  {
    id: 'threshold',
    name: 'Threshold Adjustment',
    desc: 'Adjust decision thresholds per demographic group to equalise positive outcome rates.',
    icon: <HiOutlineAdjustmentsHorizontal />,
    color: '#00D68F',
  },
];

const ScoreComparison = ({ before, after, label }) => {
  const delta = after - before;
  const improved = delta > 0;
  return (
    <div className="score-comparison">
      <span className="score-comparison__label">{label}</span>
      <div className="score-comparison__values">
        <span className="score-comparison__before">{before}</span>
        <span className="score-comparison__arrow">→</span>
        <span className="score-comparison__after" style={{ color: improved ? 'var(--color-success)' : delta < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
          {after}
        </span>
        {delta !== 0 && (
          <span className={`score-comparison__delta ${improved ? 'score-comparison__delta--up' : 'score-comparison__delta--down'}`}>
            {improved ? <HiOutlineArrowTrendingUp /> : <HiOutlineArrowTrendingDown />}
            {improved ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
};

const MetricRow = ({ name, beforeVal, afterVal, beforePass, afterPass, format }) => {
  if (beforeVal == null) return null;
  const afterFormatted = afterVal != null ? format(afterVal) : '—';
  return (
    <div className="metric-compare-row">
      <span className="metric-compare-row__name">{name}</span>
      <div className="metric-compare-row__cell">
        <span className="metric-compare-row__val">{format(beforeVal)}</span>
        {beforePass != null && (
          beforePass
            ? <HiOutlineCheckCircle style={{ color: 'var(--color-success)', fontSize: 14 }} />
            : <HiOutlineXCircle style={{ color: 'var(--color-danger)', fontSize: 14 }} />
        )}
      </div>
      <div className="metric-compare-row__cell">
        <span className="metric-compare-row__val">{afterFormatted}</span>
        {afterPass != null && (
          afterPass
            ? <HiOutlineCheckCircle style={{ color: 'var(--color-success)', fontSize: 14 }} />
            : <HiOutlineXCircle style={{ color: 'var(--color-danger)', fontSize: 14 }} />
        )}
      </div>
    </div>
  );
};

const MitigationTab = ({ audit }) => {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);

  // Strategy-specific params
  const [resampleMode, setResampleMode] = useState('oversample');
  const [selectedAttr, setSelectedAttr] = useState(audit.config?.protectedAttributes?.[0] || '');
  const [thresholds, setThresholds] = useState({});
  const [selectedProxies, setSelectedProxies] = useState([]);

  const protectedAttrs = audit.config?.protectedAttributes || [];
  const mitigations = audit.mitigations || [];

  const proxyColumns = useMemo(() => {
    const shapVals = audit.shapValues?.shapValues || [];
    return shapVals
      .filter((s) => s.biasRisk === 'high' || s.biasRisk === 'medium')
      .map((s) => s.feature)
      .filter((f) => !protectedAttrs.includes(f) && f !== audit.config?.targetColumn);
  }, [audit, protectedAttrs]);

  const buildParams = useCallback(() => {
    switch (selectedStrategy) {
      case 'resample':
        return { mode: resampleMode, attribute: selectedAttr };
      case 'reweight':
        return { attribute: selectedAttr };
      case 'proxy_removal':
        return { proxyCols: selectedProxies };
      case 'threshold':
        return { attribute: selectedAttr, thresholds };
      default:
        return {};
    }
  }, [selectedStrategy, resampleMode, selectedAttr, selectedProxies, thresholds]);

  const handlePreview = async () => {
    if (!selectedStrategy) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await auditService.previewMitigation(audit._id, selectedStrategy, buildParams());
      setPreview(res.data.preview);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleApply = async () => {
    if (!selectedStrategy) return;
    setApplying(true);
    try {
      await auditService.applyMitigation(audit._id, selectedStrategy, buildParams());
      toast.success('Mitigation recorded successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const handleSelectStrategy = (id) => {
    setSelectedStrategy(id);
    setPreview(null);
  };

  const handleThresholdChange = (group, value) => {
    setThresholds((prev) => ({ ...prev, [group]: parseFloat(value) }));
  };

  const handleToggleProxy = (col) => {
    setSelectedProxies((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const getFirstAttrMetrics = (metrics) => {
    if (!metrics) return {};
    const key = Object.keys(metrics)[0];
    return key ? metrics[key] : {};
  };

  return (
    <div className="tab-mitigation">
      {/* Strategy picker */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <HiOutlineSparkles />
          <h3>Select Mitigation Strategy</h3>
        </div>
        <div className="strategy-grid">
          {STRATEGIES.map((s) => (
            <Card
              key={s.id}
              hover
              className={`strategy-card ${selectedStrategy === s.id ? 'strategy-card--selected' : ''}`}
              onClick={() => handleSelectStrategy(s.id)}
              style={{ '--strategy-color': s.color }}
            >
              <div className="strategy-card__icon" style={{ color: s.color, background: `${s.color}15` }}>
                {s.icon}
              </div>
              <h4>{s.name}</h4>
              <p>{s.desc}</p>
              {selectedStrategy === s.id && (
                <motion.div
                  className="strategy-card__check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <HiOutlineCheckCircle />
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Strategy configuration */}
      <AnimatePresence mode="wait">
        {selectedStrategy && (
          <motion.div
            key={selectedStrategy}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="config-card">
              <div className="section-header">
                <HiOutlineAdjustmentsHorizontal />
                <h3>Configure {STRATEGIES.find((s) => s.id === selectedStrategy)?.name}</h3>
              </div>

              {/* Resample config */}
              {selectedStrategy === 'resample' && (
                <div className="config-fields">
                  <div className="config-field">
                    <label>Protected Attribute</label>
                    <div className="attr-selector__pills">
                      {protectedAttrs.map((a) => (
                        <button key={a} className={`attr-pill ${selectedAttr === a ? 'attr-pill--active' : ''}`} onClick={() => setSelectedAttr(a)}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="config-field">
                    <label>Mode</label>
                    <div className="attr-selector__pills">
                      <button className={`attr-pill ${resampleMode === 'oversample' ? 'attr-pill--active' : ''}`} onClick={() => setResampleMode('oversample')}>
                        Oversample (add to minority)
                      </button>
                      <button className={`attr-pill ${resampleMode === 'undersample' ? 'attr-pill--active' : ''}`} onClick={() => setResampleMode('undersample')}>
                        Undersample (reduce majority)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reweight config */}
              {selectedStrategy === 'reweight' && (
                <div className="config-fields">
                  <div className="config-field">
                    <label>Protected Attribute</label>
                    <div className="attr-selector__pills">
                      {protectedAttrs.map((a) => (
                        <button key={a} className={`attr-pill ${selectedAttr === a ? 'attr-pill--active' : ''}`} onClick={() => setSelectedAttr(a)}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="config-hint">Weights will be computed automatically based on group size and positive outcome rate imbalances.</p>
                </div>
              )}

              {/* Proxy removal config */}
              {selectedStrategy === 'proxy_removal' && (
                <div className="config-fields">
                  <div className="config-field">
                    <label>Proxy Columns to Remove</label>
                    {proxyColumns.length > 0 ? (
                      <div className="proxy-checkboxes">
                        {proxyColumns.map((col) => (
                          <label key={col} className={`proxy-checkbox ${selectedProxies.includes(col) ? 'proxy-checkbox--checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedProxies.includes(col)}
                              onChange={() => handleToggleProxy(col)}
                            />
                            <span>{col}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="config-hint">No high-risk proxy columns detected in the SHAP analysis. You can still run this on any columns you identify manually.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Threshold config */}
              {selectedStrategy === 'threshold' && (
                <div className="config-fields">
                  <div className="config-field">
                    <label>Protected Attribute</label>
                    <div className="attr-selector__pills">
                      {protectedAttrs.map((a) => (
                        <button key={a} className={`attr-pill ${selectedAttr === a ? 'attr-pill--active' : ''}`} onClick={() => setSelectedAttr(a)}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="config-field">
                    <label>Per-Group Thresholds</label>
                    <p className="config-hint">Adjust the decision threshold for each group. Lower values make approval easier for that group.</p>
                    <div className="threshold-sliders">
                      {(() => {
                        const dp = audit.fairnessMetrics?.[selectedAttr]?.demographicParity;
                        const groups = dp?.groups || {};
                        return Object.entries(groups).map(([group, data]) => (
                          <div key={group} className="threshold-slider">
                            <div className="threshold-slider__header">
                              <span className="threshold-slider__group">{group}</span>
                              <span className="threshold-slider__rate">
                                Current rate: {(data.positiveRate * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="threshold-slider__row">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={thresholds[group] ?? 0.5}
                                onChange={(e) => handleThresholdChange(group, e.target.value)}
                                className="threshold-slider__input"
                              />
                              <span className="threshold-slider__value">
                                {(thresholds[group] ?? 0.5).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview button */}
              <div className="config-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePreview}
                  loading={previewing}
                  disabled={
                    previewing ||
                    (selectedStrategy === 'proxy_removal' && !selectedProxies.length) ||
                    (selectedStrategy === 'threshold' && !Object.keys(thresholds).length)
                  }
                >
                  Preview Before / After
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview results */}
      <AnimatePresence mode="wait">
        {previewing && !preview && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="mitigation-loading">
                <Spinner size="md" />
                <p>Computing before / after comparison...</p>
              </div>
            </Card>
          </motion.div>
        )}

        {preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="preview-result"
          >
            {/* Score comparison hero */}
            <Card className="comparison-hero">
              <div className="comparison-hero__inner">
                <div className="comparison-hero__side comparison-hero__side--before">
                  <span className="comparison-hero__label">Before</span>
                  <span className="comparison-hero__score">{preview.before.fairnessScore.score}</span>
                  <Badge variant={preview.before.severity === 'low' ? 'success' : preview.before.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                    {preview.before.severity?.toUpperCase()}
                  </Badge>
                  <span className="comparison-hero__detail">{preview.before.rowCount} rows · {preview.before.columnCount} cols</span>
                </div>
                <div className="comparison-hero__divider">
                  <span>→</span>
                </div>
                <div className="comparison-hero__side comparison-hero__side--after">
                  <span className="comparison-hero__label">After</span>
                  <span className="comparison-hero__score" style={{
                    color: preview.after.fairnessScore.score > preview.before.fairnessScore.score
                      ? 'var(--color-success)' : 'var(--color-text-primary)',
                  }}>
                    {preview.after.fairnessScore.score}
                  </span>
                  <Badge variant={preview.after.severity === 'low' ? 'success' : preview.after.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                    {preview.after.severity?.toUpperCase()}
                  </Badge>
                  <span className="comparison-hero__detail">{preview.after.rowCount} rows · {preview.after.columnCount} cols</span>
                </div>
              </div>
              <ScoreComparison
                before={preview.before.fairnessScore.score}
                after={preview.after.fairnessScore.score}
                label="Fairness Score"
              />
            </Card>

            {/* Metric-by-metric comparison */}
            <Card>
              <div className="section-header">
                <HiOutlineScale />
                <h3>Metric Comparison</h3>
              </div>
              <div className="metric-compare-table">
                <div className="metric-compare-header">
                  <span>Metric</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                {(() => {
                  const bm = getFirstAttrMetrics(preview.before.metrics);
                  const am = getFirstAttrMetrics(preview.after.metrics);
                  const pct = (v) => v != null ? (v * 100).toFixed(1) + '%' : '—';
                  const dec = (v) => v != null ? v.toFixed(3) : '—';
                  return (
                    <>
                      <MetricRow name="Demographic Parity" beforeVal={bm.demographicParity?.disparity} afterVal={am.demographicParity?.disparity} beforePass={bm.demographicParity?.pass} afterPass={am.demographicParity?.pass} format={pct} />
                      <MetricRow name="Equal Opportunity" beforeVal={bm.equalOpportunity?.disparity} afterVal={am.equalOpportunity?.disparity} beforePass={bm.equalOpportunity?.pass} afterPass={am.equalOpportunity?.pass} format={pct} />
                      <MetricRow name="Predictive Parity" beforeVal={bm.predictiveParity?.disparity} afterVal={am.predictiveParity?.disparity} beforePass={bm.predictiveParity?.pass} afterPass={am.predictiveParity?.pass} format={pct} />
                      <MetricRow name="Disparate Impact" beforeVal={bm.disparateImpact?.ratio} afterVal={am.disparateImpact?.ratio} beforePass={bm.disparateImpact?.pass} afterPass={am.disparateImpact?.pass} format={dec} />
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Strategy details */}
            {preview.strategyDetails && (
              <Card>
                <div className="section-header">
                  <HiOutlineAdjustmentsHorizontal />
                  <h3>Strategy Details</h3>
                </div>
                {preview.strategyDetails.changes && (
                  <div className="detail-chips">
                    {Object.entries(preview.strategyDetails.changes).map(([group, change]) => (
                      <div key={group} className="detail-chip">
                        <span className="detail-chip__group">{group}</span>
                        <span className="detail-chip__before">{change.before}</span>
                        <span className="detail-chip__arrow">→</span>
                        <span className="detail-chip__after" style={{
                          color: change.after > change.before ? 'var(--color-success)' : change.after < change.before ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                        }}>
                          {change.after}
                        </span>
                        <span className="detail-chip__label">rows</span>
                      </div>
                    ))}
                  </div>
                )}
                {preview.strategyDetails.groupWeights && (
                  <div className="detail-chips">
                    {Object.entries(preview.strategyDetails.groupWeights).map(([group, info]) => (
                      <div key={group} className="detail-chip">
                        <span className="detail-chip__group">{group}</span>
                        <span className="detail-chip__weight">
                          Weight: <strong>{info.weight}×</strong>
                        </span>
                        <span className="detail-chip__label">({info.count} rows, {(info.positiveRate * 100).toFixed(1)}% rate)</span>
                      </div>
                    ))}
                  </div>
                )}
                {preview.strategyDetails.removedColumns?.length > 0 && (
                  <div className="detail-chips">
                    {preview.strategyDetails.removedColumns.map((col) => (
                      <div key={col} className="detail-chip detail-chip--removed">
                        <HiOutlineTrash />
                        <span>{col}</span>
                      </div>
                    ))}
                  </div>
                )}
                {preview.strategyDetails.adjustedCount != null && (
                  <p className="config-hint" style={{ marginTop: 'var(--space-3)' }}>
                    {preview.strategyDetails.adjustedCount} row{preview.strategyDetails.adjustedCount !== 1 ? 's' : ''} had their outcome adjusted.
                  </p>
                )}
              </Card>
            )}

            {/* Apply button */}
            <div className="config-actions">
              <Button variant="primary" size="sm" onClick={handleApply} loading={applying}>
                Apply Mitigation
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applied mitigations history */}
      {mitigations.length > 0 && (
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div className="section-header">
              <HiOutlineClock />
              <h3>Applied Mitigations</h3>
              <Badge variant="default" size="sm">{mitigations.length}</Badge>
            </div>
            <div className="mitigation-history">
              {mitigations.map((m, i) => {
                const strat = STRATEGIES.find((s) => s.id === m.strategy);
                return (
                  <div key={i} className="mitigation-history__item">
                    <div className="mitigation-history__icon" style={{ color: strat?.color || 'var(--color-accent)', background: `${strat?.color || 'var(--color-accent)'}15` }}>
                      {strat?.icon || <HiOutlineSparkles />}
                    </div>
                    <div className="mitigation-history__body">
                      <h4>{strat?.name || m.strategy}</h4>
                      <p>{new Date(m.appliedAt).toLocaleString()}</p>
                    </div>
                    <div className="mitigation-history__scores">
                      <span className="mitigation-history__before">{m.before?.score}</span>
                      <span>→</span>
                      <span className="mitigation-history__after" style={{
                        color: m.after?.score > m.before?.score ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      }}>
                        {m.after?.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MitigationTab;
