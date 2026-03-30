import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HiOutlineHome,
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineDocumentChartBar,
  HiOutlineWrenchScrewdriver,
  HiOutlineBell,
  HiOutlineCog6Tooth,
  HiOutlineChevronLeft,
} from 'react-icons/hi2';
import { toggleSidebar } from '../../app/uiSlice';
import { Logo } from '../common';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: <HiOutlineHome />, label: 'Overview', end: true },
  { to: '/dashboard/datasets', icon: <HiOutlineCircleStack />, label: 'Datasets' },
  { to: '/dashboard/audits', icon: <HiOutlineCpuChip />, label: 'Audits' },
  { to: '/dashboard/reports', icon: <HiOutlineDocumentChartBar />, label: 'Reports' },
  { to: '/dashboard/mitigation', icon: <HiOutlineWrenchScrewdriver />, label: 'Mitigation' },
  { to: '/dashboard/monitoring', icon: <HiOutlineBell />, label: 'Monitoring' },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar--collapsed'}`}>
      <div className="sidebar__head">
        <Logo size="sm" withText={sidebarOpen} />
        <button
          className="sidebar__toggle"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle sidebar"
        >
          <HiOutlineChevronLeft />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {sidebarOpen && <span className="sidebar__link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
        >
          <span className="sidebar__link-icon"><HiOutlineCog6Tooth /></span>
          {sidebarOpen && <span className="sidebar__link-label">Settings</span>}
        </NavLink>

        {user && (
          <div className="sidebar__user">
            <span className="sidebar__user-avatar">{initials}</span>
            {sidebarOpen && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user.name}</span>
                <span className="sidebar__user-role">{user.role}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
