import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  HiOutlineCog6Tooth,
  HiOutlineUserCircle,
  HiOutlineBellAlert,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { Card, Button } from '../../components/common';
import { logoutUser } from '../auth/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './SettingsPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [alertNotifs, setAlertNotifs] = useState(true);
  const [fairnessThreshold, setFairnessThreshold] = useState(70);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate('/login'));
  };

  const handleSave = () => {
    toast.success('Settings saved (local only)');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="settings-page">
      <motion.div className="settings-page__header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <h2>Settings</h2>
        <p>Manage your account and preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Card className="settings-section">
          <div className="settings-section__header">
            <HiOutlineUserCircle />
            <h3>Profile</h3>
          </div>
          <div className="settings-profile">
            <div className="settings-profile__avatar">{initials}</div>
            <div className="settings-profile__info">
              <div className="settings-field">
                <label>Name</label>
                <span>{user?.name || '—'}</span>
              </div>
              <div className="settings-field">
                <label>Email</label>
                <span>{user?.email || '—'}</span>
              </div>
              <div className="settings-field">
                <label>Role</label>
                <span className="settings-role">{user?.role || 'user'}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <Card className="settings-section">
          <div className="settings-section__header">
            <HiOutlineBellAlert />
            <h3>Notifications</h3>
          </div>
          <div className="settings-toggles">
            <div className="settings-toggle-row">
              <div>
                <strong>Email notifications</strong>
                <p>Receive email alerts for drift warnings</p>
              </div>
              <button
                className={`settings-toggle ${emailNotifs ? 'settings-toggle--on' : ''}`}
                onClick={() => setEmailNotifs((v) => !v)}
              >
                <span className="settings-toggle__knob" />
              </button>
            </div>
            <div className="settings-toggle-row">
              <div>
                <strong>In-app alert sounds</strong>
                <p>Play a sound when critical alerts are detected</p>
              </div>
              <button
                className={`settings-toggle ${alertNotifs ? 'settings-toggle--on' : ''}`}
                onClick={() => setAlertNotifs((v) => !v)}
              >
                <span className="settings-toggle__knob" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Defaults */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
        <Card className="settings-section">
          <div className="settings-section__header">
            <HiOutlineShieldCheck />
            <h3>Audit Defaults</h3>
          </div>
          <div className="settings-default-field">
            <label>Default fairness threshold</label>
            <div className="settings-slider-row">
              <input
                type="range"
                min={30}
                max={95}
                value={fairnessThreshold}
                onChange={(e) => setFairnessThreshold(Number(e.target.value))}
                className="settings-slider"
              />
              <span className="settings-slider-value">{fairnessThreshold}</span>
            </div>
            <p className="settings-hint">Audits scoring below this threshold will be flagged.</p>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div className="settings-page__actions" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
        <Button onClick={handleSave}>Save Preferences</Button>
        <Button variant="ghost" onClick={handleLogout} icon={<HiOutlineArrowRightOnRectangle />}>
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
