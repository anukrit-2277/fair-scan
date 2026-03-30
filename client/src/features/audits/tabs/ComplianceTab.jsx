import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { Card, Badge } from '../../../components/common';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

const ComplianceTab = ({ audit }) => {
  const summary = audit.biasSummary;
  const compliance = summary?.complianceNotes || [];
  const findings = summary?.findings || [];
  const overallRisk = summary?.overallRiskLevel || 'unknown';

  return (
    <div className="tab-compliance">
      {/* Overall risk banner */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className={`risk-banner risk-banner--${overallRisk}`}>
          <div className="risk-banner__inner">
            <div className="risk-banner__icon-wrap">
              {overallRisk === 'low' ? <HiOutlineShieldCheck /> : <HiOutlineExclamationTriangle />}
            </div>
            <div className="risk-banner__info">
              <h3>Overall Compliance Risk: <span className="risk-banner__level">{overallRisk.toUpperCase()}</span></h3>
              <p>{summary?.executiveSummary || 'No compliance summary available.'}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Regulatory cards */}
      {compliance.length > 0 && (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <HiOutlineDocumentText />
            <h3>Regulatory Mapping</h3>
            <Badge variant="default" size="sm">{compliance.length} regulations</Badge>
          </div>
          <div className="compliance-grid">
            {compliance.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <Card className="compliance-card" hover>
                  <div className="compliance-card__header">
                    <div className={`compliance-card__risk-dot compliance-card__risk-dot--${c.riskLevel}`} />
                    <h4>{c.regulation}</h4>
                    <Badge
                      variant={c.riskLevel === 'high' ? 'danger' : c.riskLevel === 'medium' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {c.riskLevel}
                    </Badge>
                  </div>
                  <p className="compliance-card__relevance">{c.relevance}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detailed findings as compliance context */}
      {findings.length > 0 && (
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div className="section-header">
              <HiOutlineExclamationTriangle />
              <h3>Audit Findings with Regulatory Impact</h3>
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
                      {f.title}
                    </h4>
                    <p className="finding-item__desc">{f.description}</p>
                    {f.affectedGroups?.length > 0 && (
                      <div className="finding-item__groups">
                        {f.affectedGroups.map((g, gi) => (
                          <Badge key={gi} variant="default" size="sm">{g}</Badge>
                        ))}
                      </div>
                    )}
                    {f.recommendation && <p className="finding-item__rec">{f.recommendation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {!compliance.length && !findings.length && (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
              No compliance data available for this audit.
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ComplianceTab;
