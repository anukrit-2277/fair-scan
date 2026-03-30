import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <Topbar />
      <main
        className="dashboard-layout__main"
        style={{
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '68px',
        }}
      >
        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
