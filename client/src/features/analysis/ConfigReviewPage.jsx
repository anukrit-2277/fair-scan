import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineCpuChip,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineBuildingLibrary,
  HiOutlineBriefcase,
  HiOutlineHeart,
  HiOutlineAcademicCap,
  HiOutlineHomeModern,
  HiOutlineScale,
  HiOutlineShieldExclamation,
  HiOutlineTableCells,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCubeTransparent,
  HiOutlineCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Spinner } from '../../components/common';
import {
  fetchDataset,
  clearCurrent,
  analyzeDataset,
  confirmDatasetConfig,
  updateCurrentColumns,
  updateCurrentAnalysis,
} from '../datasets/datasetSlice';
import './ConfigReviewPage.css';

const DOMAIN_ICONS = {
  lending: HiOutlineBuildingLibrary,
  hiring: HiOutlineBriefcase,
  healthcare: HiOutlineHeart,
  insurance: HiOutlineShieldExclamation,
  criminal_justice: HiOutlineScale,
  education: HiOutlineAcademicCap,
  housing: HiOutlineHomeModern,
  general: HiOutlineCubeTransparent,
};

const DOMAIN_OPTIONS = [
  { value: 'lending', label: 'Lending / Credit' },
  { value: 'hiring', label: 'Hiring / Recruitment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'criminal_justice', label: 'Criminal Justice' },
  { value: 'education', label: 'Education' },
  { value: 'housing', label: 'Housing' },
  { value: 'general', label: 'General / Other' },
];

const SCAN_STEPS = [
  { key: 'schema', label: 'Analyzing schema structure', delay: 0 },
  { key: 'protected', label: 'Detecting protected attributes', delay: 1200 },
  { key: 'proxy', label: 'Identifying proxy correlations (Gemini)', delay: 2800 },
  { key: 'usecase', label: 'Classifying use-case domain', delay: 4200 },
  { key: 'summary', label: 'Generating fairness summary', delay: 5400 },
];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const level = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
  return (
    <div className="confidence-bar-wrap">
      <div className="confidence-bar">
        <div
          className={`confidence-bar__fill confidence-bar__fill--${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct}%</span>
    </div>
  );
};

const ScanningState = ({ analyzing }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!analyzing) return;
    setActiveStep(0);
    const timers = SCAN_STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i + 1), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [analyzing]);

  return (
    <motion.div className="scanning-overlay" {...fadeIn}>
      <motion.div
        className="scanning-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      >
        <HiOutlineCpuChip />
      </motion.div>
      <div>
        <h3 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
          Analyzing with Gemini AI
        </h3>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Scanning your dataset for fairness-relevant patterns...
        </p>
      </div>
      <div className="scanning-steps">
        {SCAN_STEPS.map((step, i) => {
          const done = activeStep > i;
          const active = activeStep === i;
          return (
            <motion.div
              key={step.key}
              className={`scanning-step ${active ? 'scanning-step--active' : ''} ${done ? 'scanning-step--done' : ''}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay / 1000, duration: 0.3 }}
            >
              <span className="scanning-step__icon">
                {done ? <HiOutlineCheckCircle /> : active ? <HiOutlineSparkles /> : '·'}
              </span>
              {step.label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

const ConfigReviewPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: dataset, loading, analyzing, confirming } = useSelector((s) => s.datasets);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchDataset(id));
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  const columns = useMemo(() => dataset?.schemaInfo?.columns || [], [dataset]);
  const analysis = dataset?.analysis || {};
  const isAnalyzed = dataset?.status === 'analyzed' || dataset?.status === 'confirmed';
  const isConfirmed = dataset?.status === 'confirmed';

  const protectedCount = useMemo(() => columns.filter((c) => c.isProtected).length, [columns]);
  const proxyCount = useMemo(() => columns.filter((c) => c.isProxy).length, [columns]);

  const handleAnalyze = async () => {
    try {
      await dispatch(analyzeDataset(id)).unwrap();
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Analysis failed');
    }
  };

  const toggleProtected = useCallback((colName) => {
    const updated = columns.map((c) =>
      c.name === colName ? { ...c, isProtected: !c.isProtected } : c
    );
    dispatch(updateCurrentColumns(updated));
  }, [columns, dispatch]);

  const toggleProxy = useCallback((colName) => {
    const updated = columns.map((c) =>
      c.name === colName ? { ...c, isProxy: !c.isProxy } : c
    );
    dispatch(updateCurrentColumns(updated));
  }, [columns, dispatch]);

  const handleDomainChange = (domain) => {
    dispatch(updateCurrentAnalysis({ useCase: { ...analysis.useCase, domain } }));
  };

  const handleConfirm = async () => {
    try {
      await dispatch(confirmDatasetConfig({
        id,
        config: {
          columns,
          useCase: analysis.useCase,
          targetColumn: analysis.targetColumn,
        },
      })).unwrap();
      toast.success('Configuration confirmed!');
      setEditing(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to confirm');
    }
  };

  if (loading || !dataset) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const DomainIcon = DOMAIN_ICONS[analysis.useCase?.domain] || DOMAIN_ICONS.general;

  return (
    <motion.div className="config-review" initial="initial" animate="animate" variants={staggerChildren}>
      {/* Top bar */}
      <motion.div className="config-review__topbar" variants={fadeIn}>
        <div className="config-review__topbar-left">
          <Button variant="ghost" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate(`/dashboard/datasets/${id}`)}>
            Back
          </Button>
          <div className="config-review__header">
            <h2>{dataset.name}</h2>
            <p>
              {dataset.schemaInfo?.rowCount?.toLocaleString() || 0} rows · {columns.length} columns · {dataset.format?.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="config-review__actions">
          {isAnalyzed && !isConfirmed && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
                <HiOutlineAdjustmentsHorizontal style={{ marginRight: 6 }} />
                {editing ? 'Cancel Edit' : 'Edit Config'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} loading={confirming}>
                <HiOutlineCheck style={{ marginRight: 6 }} />
                Confirm Config
              </Button>
            </>
          )}
          {isConfirmed && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              <HiOutlineAdjustmentsHorizontal style={{ marginRight: 6 }} />
              {editing ? 'Cancel' : 'Re-edit'}
            </Button>
          )}
          {isConfirmed && editing && (
            <Button variant="primary" size="sm" onClick={handleConfirm} loading={confirming}>
              <HiOutlineCheck style={{ marginRight: 6 }} />
              Save Changes
            </Button>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Not yet analyzed — show trigger */}
        {!isAnalyzed && !analyzing && (
          <motion.div key="trigger" {...fadeIn}>
            <Card>
              <div className="analyze-trigger">
                <div className="analyze-icon-wrap">
                  <HiOutlineSparkles />
                </div>
                <h3>Ready to Analyze</h3>
                <p>
                  FairScan will use Gemini AI to detect protected attributes, proxy correlations, 
                  and classify this dataset&apos;s use-case domain for fairness auditing.
                </p>
                <Button variant="primary" onClick={handleAnalyze} loading={analyzing}>
                  <HiOutlineCpuChip style={{ marginRight: 8 }} />
                  Run Auto-Detect
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Scanning animation */}
        {analyzing && (
          <motion.div key="scanning" {...fadeIn}>
            <Card>
              <ScanningState analyzing={analyzing} />
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {isAnalyzed && !analyzing && (
          <motion.div key="results" className="config-review__grid" variants={staggerChildren} initial="initial" animate="animate">
            {/* Confirmed banner */}
            {isConfirmed && !editing && (
              <motion.div className="confirmed-banner" style={{ gridColumn: '1 / -1' }} variants={fadeIn}>
                <HiOutlineCheckCircle />
                Configuration confirmed — ready for fairness audit.
              </motion.div>
            )}

            {/* Summary */}
            <motion.div className="summary-card" variants={fadeIn}>
              <Card>
                <div className="config-section-header">
                  <HiOutlineSparkles />
                  <h3>AI Analysis Summary</h3>
                </div>
                <div className="summary-card__content">
                  <p className="summary-card__text">{analysis.summary || 'No summary available.'}</p>
                  <div className="summary-card__stats">
                    <div className="summary-stat">
                      <span className="summary-stat__value">{protectedCount}</span>
                      <span className="summary-stat__label">Protected Attrs</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-stat__value">{proxyCount}</span>
                      <span className="summary-stat__label">Proxy Attrs</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-stat__value">{columns.length}</span>
                      <span className="summary-stat__label">Total Columns</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-stat__value">{dataset.schemaInfo?.rowCount?.toLocaleString() || '—'}</span>
                      <span className="summary-stat__label">Rows</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Use-case */}
            <motion.div variants={fadeIn}>
              <Card>
                <div className="config-section-header">
                  <HiOutlineEye />
                  <h3>Detected Use-Case</h3>
                  {analysis.useCase?.confidence != null && (
                    <Badge variant="info" size="sm">{Math.round(analysis.useCase.confidence * 100)}% conf.</Badge>
                  )}
                </div>
                <div className="usecase-card__body">
                  <div className="usecase-domain">
                    <div className={`usecase-domain__icon usecase-domain__icon--${analysis.useCase?.domain || 'general'}`}>
                      <DomainIcon />
                    </div>
                    <div className="usecase-domain__info">
                      <h4>{analysis.useCase?.domain?.replace('_', ' ') || 'General'}</h4>
                      <p>{analysis.useCase?.description || 'Unable to determine use-case.'}</p>
                    </div>
                  </div>
                  {(editing || (!isConfirmed && isAnalyzed)) && (
                    <select
                      className="usecase-select"
                      value={analysis.useCase?.domain || 'general'}
                      onChange={(e) => handleDomainChange(e.target.value)}
                    >
                      {DOMAIN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Target Column */}
            <motion.div variants={fadeIn}>
              <Card>
                <div className="config-section-header">
                  <HiOutlineShieldCheck />
                  <h3>Prediction Target</h3>
                </div>
                <div className="target-col-card__body">
                  {analysis.targetColumn?.column ? (
                    <>
                      <div className="target-col-display">
                        <Badge variant="accent" size="sm">TARGET</Badge>
                        <span className="target-col-display__name">{analysis.targetColumn.column}</span>
                      </div>
                      <p className="target-col-display__reason">{analysis.targetColumn.reason}</p>
                    </>
                  ) : (
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                      No prediction target detected.
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Columns table */}
            <motion.div className="columns-card" variants={fadeIn}>
              <Card padding="none">
                <div className="config-section-header" style={{ padding: 'var(--space-4) var(--space-5)', margin: 0, borderBottom: 'none' }}>
                  <HiOutlineTableCells />
                  <h3>Column Configuration</h3>
                  <Badge variant="default" size="sm">{columns.length}</Badge>
                </div>
                <div className="columns-table-wrap">
                  <table className="columns-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Protected</th>
                        <th>Proxy</th>
                        <th>Proxy For</th>
                        <th>Confidence</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <motion.tr
                          key={col.name}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                        >
                          <td className="col-name">{col.name}</td>
                          <td><Badge variant={col.dtype === 'number' ? 'info' : col.dtype === 'boolean' ? 'warning' : 'default'} size="sm">{col.dtype}</Badge></td>
                          <td>
                            <div className="col-toggle col-toggle--danger">
                              <input
                                type="checkbox"
                                checked={col.isProtected || false}
                                onChange={() => (editing || !isConfirmed) && toggleProtected(col.name)}
                                disabled={isConfirmed && !editing}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="col-toggle col-toggle--warning">
                              <input
                                type="checkbox"
                                checked={col.isProxy || false}
                                onChange={() => (editing || !isConfirmed) && toggleProxy(col.name)}
                                disabled={isConfirmed && !editing}
                              />
                            </div>
                          </td>
                          <td>{col.proxyFor ? <span className="col-proxy-for">{col.proxyFor}</span> : '—'}</td>
                          <td>{col.proxyConfidence != null ? <ConfidenceBar value={col.proxyConfidence} /> : '—'}</td>
                          <td><span className="col-reason">{col.protectedReason || col.proxyReason || '—'}</span></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConfigReviewPage;
