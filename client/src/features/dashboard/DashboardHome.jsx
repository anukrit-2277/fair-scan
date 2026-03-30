import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineArrowUpRight,
} from 'react-icons/hi2';
import { Card, Badge, Button } from '../../components/common';
import './DashboardHome.css';

const STATS = [
  {
    icon: <HiOutlineCircleStack />,
    label: 'Datasets',
    value: '—',
    change: null,
    color: 'accent',
  },
  {
    icon: <HiOutlineCpuChip />,
    label: 'Audits Run',
    value: '—',
    change: null,
    color: 'info',
  },
  {
    icon: <HiOutlineShieldCheck />,
    label: 'Issues Found',
    value: '—',
    change: null,
    color: 'warning',
  },
  {
    icon: <HiOutlineBell />,
    label: 'Active Monitors',
    value: '—',
    change: null,
    color: 'success',
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DashboardHome = () => {
  const { user } = useSelector((s) => s.auth);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dash-home">
      <motion.div
        className="dash-home__header"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={0}
      >
        <div>
          <h2 className="dash-home__title">Welcome back, {firstName}</h2>
          <p className="dash-home__subtitle">
            Upload a dataset or model to start your first fairness audit.
          </p>
        </div>
        <Button icon={<HiOutlineArrowUpRight />}>New Audit</Button>
      </motion.div>

      <div className="dash-home__stats">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={i + 1}
          >
            <Card hover className="stat-card">
              <div className={`stat-card__icon stat-card__icon--${s.color}`}>
                {s.icon}
              </div>
              <div className="stat-card__body">
                <span className="stat-card__label">{s.label}</span>
                <span className="stat-card__value">{s.value}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="dash-home__grid"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={5}
      >
        <Card className="dash-home__recent">
          <div className="dash-home__card-header">
            <h3>Recent Audits</h3>
            <Badge variant="default">Coming Soon</Badge>
          </div>
          <div className="dash-home__empty">
            <HiOutlineCpuChip className="dash-home__empty-icon" />
            <p>No audits yet. Start by uploading a dataset.</p>
          </div>
        </Card>

        <Card className="dash-home__activity">
          <div className="dash-home__card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="dash-home__actions-list">
            <button className="action-item">
              <span className="action-item__icon"><HiOutlineCircleStack /></span>
              <span className="action-item__text">
                <strong>Upload Dataset</strong>
                <small>CSV, JSON, or Google Sheets</small>
              </span>
            </button>
            <button className="action-item">
              <span className="action-item__icon"><HiOutlineCpuChip /></span>
              <span className="action-item__text">
                <strong>Upload Model</strong>
                <small>ONNX, TensorFlow, scikit-learn</small>
              </span>
            </button>
            <button className="action-item">
              <span className="action-item__icon"><HiOutlineShieldCheck /></span>
              <span className="action-item__text">
                <strong>Connect Vertex AI</strong>
                <small>Pull deployed models directly</small>
              </span>
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
