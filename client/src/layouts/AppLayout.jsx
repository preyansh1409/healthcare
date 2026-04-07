import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SecurityGuardian from '../components/SecurityGuardian';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 72;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <div 
      style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: 'var(--bg-dark)',
        '--sidebar-width': `${width}px`
      }}
    >
      <SecurityGuardian />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, transition: 'all 0.3s ease', minHeight: '100vh' }}>
        <Navbar sidebarWidth={width} />
        <main style={{ marginTop: 64, padding: '1.75rem', maxWidth: 1400, margin: '64px auto 0', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
