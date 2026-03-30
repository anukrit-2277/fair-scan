import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentChartBar,
  HiOutlineDocumentArrowDown,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { Card, Badge, Button, Spinner } from '../../components/common';
import auditService from '../../services/audit.service';
import './ReportsPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getAll()
      .then((res) => setAudits((res.data?.audits || []).filter((a) => a.status === 'completed')))
      .catch(() => setAudits([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="reports-page__loader"><Spinner size="lg" /></div>;
  }

  return (
    <div className="reports-page">
      <motion.div className="reports-page__header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <div>
          <h2>Reports</h2>
          <p>Generate audit reports and model cards for completed audits.</p>
        </div>
      </motion.div>

      {!audits.length ? (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <Card className="reports-page__empty">
            <HiOutlineDocumentChartBar style={{ fontSize: '2.5rem', opacity: 0.2 }} />
            <h3>No completed audits</h3>
            <p>Complete your first fairness audit to generate reports.</p>
            <Button onClick={() => navigate('/dashboard/audits')}>Go to Audits</Button>
          </Card>
        </motion.div>
      ) : (
        <div className="reports-page__grid">
          {audits.map((audit, i) => (
            <motion.div key={audit._id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
              <Card hover className="reports-page__card">
                <div className="reports-page__card-icon">
                  <HiOutlineDocumentArrowDown />
                </div>
                <div className="reports-page__card-body">
                  <h4>{audit.datasetName}</h4>
                  <div className="reports-page__card-meta">
                    <Badge variant={audit.severityScore === 'critical' || audit.severityScore === 'high' ? 'danger' : audit.severityScore === 'medium' ? 'warning' : 'success'} size="sm">{audit.severityScore || '—'}</Badge>
                    <span>Score: {audit.fairnessScore?.score?.toFixed(0) || '—'}</span>
                    <span>{new Date(audit.completedAt || audit.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<HiOutlineArrowRight />}
                  onClick={() => navigate(`/dashboard/audits/${audit._id}`, { state: { tab: 'reports' } })}
                >
                  Generate
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
