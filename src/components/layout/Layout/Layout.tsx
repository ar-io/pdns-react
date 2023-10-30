import { Outlet } from 'react-router-dom';

import Footer from '../Footer/Footer';
import NavBar from '../Navbar/Navbar';
import Notifications from '../Notifications/Notifications';
import './styles.css';

function Layout() {
  return (
    <div
      className="flex flex-column"
      style={{
        gap: 0,
        position: 'relative',
        boxSizing: 'border-box',
        height: '100vh',
      }}
    >
      <div
        id="layout"
        className="flex flex-row"
        style={{
          backgroundColor: 'var(--card-bg)',
          boxSizing: 'border-box',
          margin: '0px',
          minHeight: 'fit-content',
        }}
      >
        <NavBar />
      </div>
      <div className="body">
        <Outlet />
        <Notifications />
      </div>

      <div
        className="flex flex-row"
        style={{
          boxSizing: 'border-box',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          height: '100%',
        }}
      >
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
