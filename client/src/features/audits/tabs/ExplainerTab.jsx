import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLightBulb,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineMinus,
  HiOutlineUser,
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

const INFLUENCE_ICON = {
  positive: <HiOutlineArrowUp style={{ color: 'var(--color-success)' }} />,
  negative: <HiOutlineArrowDown style={{ color: 'var(--color-danger)' }} />,
  neutral: <HiOutlineMinus style={{ color: 'var(--color-text-tertiary)' }} />,
};

const ExplainerTab = ({ audit }) => {
  const rows = audit.sampleRows || [];
  const cols = audit.columnNames || [];
  const [selectedRow, setSelectedRow] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  const handleExplain = async (rowIdx) => {
    setSelectedRow(rowIdx);
    setExplanation(null);
    setExplaining(true);
    try {
      const res = await auditService.explainRow(audit._id, rowIdx);
      setExplanation(res.data.explanation);
    } catch (err) {
      toast.error('Failed to generate explanation');
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="tab-explainer">
      {/* Intro */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="explainer-intro">
          <HiOutlineLightBulb className="explainer-intro__icon" />
          <div>
            <h3>Per-Decision Explainer</h3>
            <p>Select any row below to get a human-readable, AI-generated explanation of why that individual received their specific outcome. Powered by Gemini.</p>
          </div>
        </Card>
      </motion.div>

      {!rows.length ? (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
              No sample rows available for this audit. Re-run the audit to populate.
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Card padding="none">
            <div className="section-header" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <HiOutlineUser />
              <h3>Dataset Sample</h3>
              <Badge variant="default" size="sm">{rows.length} rows</Badge>
            </div>
            <div className="explainer-table-wrap">
              <table className="explainer-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {cols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 30).map((row, i) => (
                    <tr
                      key={i}
                      className={selectedRow === i ? 'explainer-table__row--selected' : ''}
                    >
                      <td className="explainer-table__idx">{i + 1}</td>
                      {cols.map((c, ci) => (
                        <td key={ci}>{String(row[ci] ?? '')}</td>
                      ))}
                      <td>
                        <button
                          className="explain-btn"
                          onClick={() => handleExplain(i)}
                          disabled={explaining && selectedRow === i}
                        >
                          {explaining && selectedRow === i ? (
                            <Spinner size="xs" />
                          ) : (
                            <>Explain <HiOutlineArrowRight /></>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Explanation result */}
      <AnimatePresence mode="wait">
        {explaining && !explanation && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="explanation-loading"
          >
            <Card>
              <div className="explanation-loading__inner">
                <Spinner size="md" />
                <p>Generating explanation for Row #{selectedRow + 1}...</p>
              </div>
            </Card>
          </motion.div>
        )}

        {explanation && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="explanation-result"
          >
            {/* Outcome header */}
            <Card className="explanation-outcome">
              <div className="explanation-outcome__row">
                <div className="explanation-outcome__label-group">
                  <span className="explanation-outcome__row-num">Row #{selectedRow + 1}</span>
                  <Badge
                    variant={explanation.outcome === 'positive' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {explanation.outcomeLabel || explanation.outcome}
                  </Badge>
                </div>
              </div>
              <p className="explanation-outcome__text">{explanation.explanation}</p>
            </Card>

            {/* Key factors */}
            {explanation.keyFactors?.length > 0 && (
              <Card>
                <div className="section-header">
                  <HiOutlineLightBulb />
                  <h3>Key Factors</h3>
                </div>
                <div className="key-factors">
                  {explanation.keyFactors.map((f, i) => (
                    <motion.div
                      key={i}
                      className="key-factor"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                    >
                      <div className="key-factor__icon">
                        {INFLUENCE_ICON[f.influence] || INFLUENCE_ICON.neutral}
                      </div>
                      <div className="key-factor__body">
                        <div className="key-factor__top">
                          <span className="key-factor__feature">{f.feature}</span>
                          <span className="key-factor__val">{f.value}</span>
                        </div>
                        <p className="key-factor__desc">{f.explanation}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Fairness flags */}
            {explanation.fairnessFlags?.length > 0 && (
              <Card className="fairness-flags-card">
                <div className="section-header">
                  <HiOutlineExclamationTriangle />
                  <h3>Fairness Flags</h3>
                </div>
                <div className="fairness-flags">
                  {explanation.fairnessFlags.map((flag, i) => (
                    <div key={i} className="fairness-flag">
                      <HiOutlineShieldCheck className="fairness-flag__icon" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Appeal guidance */}
            {explanation.appealGuidance && (
              <Card className="appeal-guidance">
                <div className="section-header">
                  <HiOutlineLightBulb />
                  <h3>What Could Change the Outcome?</h3>
                </div>
                <p className="appeal-guidance__text">{explanation.appealGuidance}</p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExplainerTab;
