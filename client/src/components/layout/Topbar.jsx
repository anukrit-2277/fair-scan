import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import { logoutUser } from '../../features/auth/authSlice';
import './Topbar.css';

const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/dashboard/datasets': 'Datasets',
  '/dashboard/audits': 'Audits',
  '/dashboard/reports': 'Reports',
  '/dashboard/mitigation': 'Mitigation',
  '/dashboard/monitoring': 'Monitoring',
  '/dashboard/settings': 'Settings',
};

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logoutUser()).then(() => navigate('/login'));
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header
      className="topbar"
      style={{ left: sidebarOpen ? 'var(--sidebar-width)' : '68px' }}
    >
      <div className="topbar__inner">
        <div className="topbar__left">
          <h1 className="topbar__title">{pageTitle}</h1>
        </div>

        <div className="topbar__right">
          <button className="topbar__icon-btn" aria-label="Notifications">
            <HiOutlineBell />
          </button>

          <div className="topbar__user-menu" ref={menuRef}>
            <button
              className="topbar__user-trigger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
            >
              <span className="topbar__user-avatar">{initials}</span>
              {user && (
                <span className="topbar__user-name">{user.name?.split(' ')[0]}</span>
              )}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="topbar__dropdown"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="topbar__dropdown-header">
                    <span className="topbar__dropdown-name">{user?.name}</span>
                    <span className="topbar__dropdown-email">{user?.email}</span>
                  </div>
                  <div className="topbar__dropdown-divider" />
                  <button
                    className="topbar__dropdown-item"
                    onClick={() => { setMenuOpen(false); navigate('/dashboard/settings'); }}
                  >
                    <HiOutlineCog6Tooth />
                    <span>Settings</span>
                  </button>
                  <button
                    className="topbar__dropdown-item"
                    onClick={() => { setMenuOpen(false); }}
                  >
                    <HiOutlineUserCircle />
                    <span>Profile</span>
                  </button>
                  <div className="topbar__dropdown-divider" />
                  <button
                    className="topbar__dropdown-item topbar__dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <HiOutlineArrowRightOnRectangle />
                    <span>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
