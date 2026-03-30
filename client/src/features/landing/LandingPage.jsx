import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineBell,
} from 'react-icons/hi2';
import { Logo, Button, Card } from '../../components/common';
import './LandingPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const FEATURES = [
  {
    icon: <HiOutlineShieldCheck />,
    title: 'Bias Detection',
    desc: 'Multi-metric fairness scoring across every demographic slice — demographic parity, equal opportunity, disparate impact.',
  },
  {
    icon: <HiOutlineLightBulb />,
    title: 'Plain-Language Explainability',
    desc: 'Gemini converts complex fairness metrics into summaries readable by legal, compliance, and policy teams.',
  },
  {
    icon: <HiOutlineCog6Tooth />,
    title: 'One-Click Mitigation',
    desc: 'Resampling, reweighting, proxy removal — with before/after previews so you commit with confidence.',
  },
  {
    icon: <HiOutlineDocumentText />,
    title: 'Audit Reports & Model Cards',
    desc: 'Auto-generated PDF reports with severity scores, recommendations, and regulatory compliance mapping.',
  },
  {
    icon: <HiOutlineChartBar />,
    title: 'SHAP Feature Attribution',
    desc: 'See exactly which features drive biased predictions — even hidden proxy attributes your team missed.',
  },
  {
    icon: <HiOutlineBell />,
    title: 'Live Monitoring',
    desc: 'Continuous fairness drift detection on deployed models with real-time alerts when thresholds breach.',
  },
];

const STEPS = [
  { num: '01', title: 'Upload', desc: 'Dataset or model — CSV, JSON, ONNX, TensorFlow, or connect Vertex AI.' },
  { num: '02', title: 'Inspect', desc: 'Auto-detect schema, flag protected & proxy attributes, compute fairness metrics.' },
  { num: '03', title: 'Explain', desc: 'Plain-English bias summaries, SHAP charts, per-decision explainers.' },
  { num: '04', title: 'Fix', desc: 'One-click debiasing with before/after comparison. Retrain with fairness constraints.' },
];

const LandingPage = () => {
  return (
    <div className="landing">
      {/* ─── Nav ─── */}
      <nav className="landing__nav">
        <div className="container flex items-center justify-between">
          <Logo size="md" />
          <div className="landing__nav-actions">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="landing__hero">
        <div className="landing__hero-glow" />
        <div className="container">
          <motion.div
            className="landing__hero-content"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <motion.span className="landing__hero-badge" variants={fadeUp} custom={0}>
              AI Fairness Auditing Platform
            </motion.span>

            <motion.h1 className="landing__hero-title" variants={fadeUp} custom={1}>
              Uncover hidden bias.
              <br />
              <span className="text-gradient">Before it causes harm.</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} custom={2}>
              FairScan inspects your datasets and ML models for discrimination,
              explains findings in plain language, and fixes bias — all on Google Cloud.
            </motion.p>

            <motion.div className="landing__hero-cta" variants={fadeUp} custom={3}>
              <Link to="/signup">
                <Button size="lg">Start Auditing</Button>
              </Link>
              <Link to="#how-it-works">
                <Button variant="secondary" size="lg">How It Works</Button>
              </Link>
            </motion.div>

            <motion.p className="landing__hero-caption" variants={fadeUp} custom={4}>
              Inspect. Explain. Fix. Monitor.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="landing__features" id="features">
        <div className="container">
          <motion.div
            className="landing__section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <h2>End-to-end fairness,<br />in one platform</h2>
            <p>From raw data upload to live model monitoring — everything organisations need to prove their AI is fair.</p>
          </motion.div>

          <div className="landing__features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                custom={i}
              >
                <Card hover className="feature-card">
                  <div className="feature-card__icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing__steps" id="how-it-works">
        <div className="container">
          <motion.div
            className="landing__section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <h2>Four steps to fair AI</h2>
            <p>A systematic workflow that takes you from raw data to audited, compliant, monitored models.</p>
          </motion.div>

          <div className="landing__steps-grid">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                className="step-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                custom={i}
              >
                <span className="step-card__num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="landing__cta">
        <div className="container">
          <motion.div
            className="landing__cta-inner"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <h2>Ready to audit your AI?</h2>
            <p>Start uncovering and fixing bias in your models today.</p>
            <Link to="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing__footer">
        <div className="container flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-sm text-tertiary">
            &copy; {new Date().getFullYear()} FairScan. Built for fair AI.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
