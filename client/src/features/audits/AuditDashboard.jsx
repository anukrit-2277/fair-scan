import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineCpuChip,
  HiOutlineExclamationTriangle,
  HiOutlineChartPie,
  HiOutlineScale,
  HiOutlineChartBar,
  HiOutlineEye,
  HiOutlineLightBulb,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { Card, Button, Spinner } from '../../components/common';
import Tabs from '../../components/common/Tabs';
import { fetchAudit, clearCurrentAudit } from './auditSlice';
import OverviewTab from './tabs/OverviewTab';
import MetricsTab from './tabs/MetricsTab';
import AttributionTab from './tabs/AttributionTab';
import SlicesTab from './tabs/SlicesTab';
import ExplainerTab from './tabs/ExplainerTab';
import ComplianceTab from './tabs/ComplianceTab';
import './AuditDashboard.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <HiOutlineChartPie /> },
  { id: 'metrics', label: 'Metrics', icon: <HiOutlineScale /> },
  { id: 'attribution', label: 'Attribution', icon: <HiOutlineChartBar /> },
  { id: 'slices', label: 'Slices', icon: <HiOutlineEye /> },
  { id: 'explainer', label: 'Explainer', icon: <HiOutlineLightBulb /> },
  { id: 'compliance', label: 'Compliance', icon: <HiOutlineDocumentText /> },
];

const TAB_COMPONENTS = {
  overview: OverviewTab,
  metrics: MetricsTab,
  attribution: AttributionTab,
  slices: SlicesTab,
  explainer: ExplainerTab,
  compliance: ComplianceTab,
};

const AuditDashboard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: audit, loading } = useSelector((s) => s.audits);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchAudit(id));
    return () => dispatch(clearCurrentAudit());
  }, [id, dispatch]);

  useEffect(() => {
    if (!audit || audit.status !== 'analyzing') return;
    const timer = setInterval(() => dispatch(fetchAudit(id)), 3000);
    return () => clearInterval(timer);
  }, [audit?.status, id, dispatch]);

  if (loading && !audit) {
    return (
      <div className="audit-dash__loader">
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

  const ActivePanel = TAB_COMPONENTS[activeTab] || OverviewTab;

  return (
    <div className="audit-dash">
      {/* Top bar */}
      <motion.div
        className="audit-dash__topbar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
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
        {/* ─── Analyzing ─── */}
        {audit.status === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="audit-status-screen">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <HiOutlineCpuChip style={{ fontSize: '2.5rem', color: 'var(--color-accent)' }} />
                </motion.div>
                <h3>Fairness Audit Running</h3>
                <p>Computing metrics, analyzing feature attributions, and generating the bias report. This may take a moment...</p>
                <Spinner size="sm" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Failed ─── */}
        {audit.status === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="audit-status-screen">
                <HiOutlineExclamationTriangle style={{ fontSize: '2.5rem', color: 'var(--color-danger)' }} />
                <h3>Audit Failed</h3>
                <p>{audit.error || 'An unexpected error occurred during the audit.'}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Pending ─── */}
        {audit.status === 'pending' && (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="audit-status-screen">
                <Spinner size="lg" />
                <h3>Audit Queued</h3>
                <p>Your audit is queued and will start shortly.</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Completed ─── */}
        {audit.status === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Tabs */}
            <motion.div
              className="audit-dash__tabs-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
            </motion.div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="audit-dash__panel"
              >
                <ActivePanel audit={audit} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditDashboard;
