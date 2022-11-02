import { Outlet } from 'react-router-dom';
import NavBar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './styles.css';

function Layout() {
  return (
    <>
      <div className="header">
        <NavBar />
      </div>
      <div className="body">
        <div className="container">
            <Outlet />
        </div>
        <div className="footer">
          <Footer />
        </div>
      </div>
    </>
  );
}

export default Layout;
