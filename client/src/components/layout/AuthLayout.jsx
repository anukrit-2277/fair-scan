import { motion } from 'framer-motion';
import { Logo } from '../common';
import './AuthLayout.css';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__ambient" />
      <div className="auth-layout__ambient auth-layout__ambient--two" />

      <motion.div
        className="auth-layout__card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-layout__header">
          <Logo size="md" />
          <div className="auth-layout__titles">
            <h1 className="auth-layout__title">{title}</h1>
            {subtitle && <p className="auth-layout__subtitle">{subtitle}</p>}
          </div>
        </div>

        {children}
      </motion.div>

      <motion.p
        className="auth-layout__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        &copy; {new Date().getFullYear()} FairScan &middot; AI Fairness Auditing
      </motion.p>
    </div>
  );
};

export default AuthLayout;
