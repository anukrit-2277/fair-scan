import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  HiOutlineCpuChip,
  HiOutlineTrash,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { fetchAudits, removeAudit } from './auditSlice';
import './AuditsListPage.css';

const SEVERITY_MAP = {
  low: { variant: 'success', label: 'Low Risk' },
  medium: { variant: 'warning', label: 'Medium Risk' },
  high: { variant: 'danger', label: 'High Risk' },
  critical: { variant: 'danger', label: 'Critical' },
};

const STATUS_MAP = {
  pending: { variant: 'default', label: 'Pending' },
  analyzing: { variant: 'info', label: 'Analyzing...' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'danger', label: 'Failed' },
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

const AuditsListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: audits, loading } = useSelector((s) => s.audits);

  useEffect(() => {
    dispatch(fetchAudits());
  }, [dispatch]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await dispatch(removeAudit(id)).unwrap();
      toast.success('Audit deleted');
    } catch (err) {
      toast.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div className="audits-list" {...fadeIn}>
      <div className="audits-list__header">
        <div>
          <h2>Fairness Audits</h2>
          <p>AI-powered bias analysis results</p>
        </div>
      </div>

      {!audits.length ? (
        <Card>
          <div className="audits-list__empty">
            <HiOutlineCpuChip />
            <h3>No audits yet</h3>
            <p>Go to a confirmed dataset and trigger a fairness audit to get started.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/datasets')}>
              View Datasets
            </Button>
          </div>
        </Card>
      ) : (
        <div className="audits-list__grid">
          {audits.map((audit, i) => {
            const sev = SEVERITY_MAP[audit.severityScore] || SEVERITY_MAP.low;
            const status = STATUS_MAP[audit.status] || STATUS_MAP.pending;

            return (
              <motion.div
                key={audit._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card
                  hover
                  className="audit-card"
                  onClick={() => audit.status === 'completed' && navigate(`/dashboard/audits/${audit._id}`)}
                  style={{ cursor: audit.status === 'completed' ? 'pointer' : 'default' }}
                >
                  <div className="audit-card__top">
                    <div className="audit-card__icon">
                      {audit.status === 'completed' ? <HiOutlineShieldCheck /> : <HiOutlineExclamationTriangle />}
                    </div>
                    <div className="audit-card__info">
                      <h4>{audit.datasetName || 'Unnamed Dataset'}</h4>
                      <span className="audit-card__date">
                        {new Date(audit.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="audit-card__metrics">
                    <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    {audit.status === 'completed' && (
                      <>
                        <Badge variant={sev.variant} size="sm">{sev.label}</Badge>
                        {audit.fairnessScore?.score != null && (
                          <span className="audit-card__score">
                            Score: <strong>{audit.fairnessScore.score}</strong>/100
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="audit-card__actions">
                    {audit.status === 'completed' && (
                      <Button variant="ghost" size="sm" icon={<HiOutlineArrowRight />} onClick={() => navigate(`/dashboard/audits/${audit._id}`)}>
                        View
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" icon={<HiOutlineTrash />} onClick={(e) => handleDelete(e, audit._id)} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default AuditsListPage;
