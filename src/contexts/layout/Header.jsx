import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { FaBell, FaCog, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import "./style.css";

const Header = () => {
  const { user, logout, unreadCount  } = useAuth();
 
  if (!user) return null;

  return (
    <Navbar bg="white" variant="light" className="border-bottom shadow-sm nav-bar sticky-top">
      <Container fluid className="px-4">
        <Navbar.Brand href="#" className="d-none d-md-block brand">
          <span className="text-primary fw-bold">Raynx</span> Systems
        </Navbar.Brand>

        <Nav className="ms-auto align-items-center">
          {/* NOTIFICATIONS */}
          <Link to={"/notifications"}>
            <Nav className="position-relative p-2">
              <FaBell size={20} className="text-muted" />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount}
                </span>
              )}
            </Nav>
          </Link>

          {/* PROFILE */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" className="bg-transparent border-0 d-flex align-items-center">
              <div className="d-flex align-items-center">
                <div className="me-2 text-end d-none d-md-block">
                  <div className="fw-medium">{user?.employee?.firstName || user?.username}</div>
                  <small className="text-muted">{user?.role?.replace("ROLE_", "")}</small>
                </div>
                <div className="avatar-circle bg-primary text-white">
                  {user?.employee?.firstName ? user.employee?.firstName[0] : "U"}
                </div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-end shadow-sm border-0">
              <Dropdown.Header className="bg-light">
                <h6 className="mb-0">{user?.employee?.firstName || user?.username}</h6>
                <small className="text-muted">{user?.email}</small>
              </Dropdown.Header>
              <Dropdown.Divider />

              <Dropdown.Item as={Link} to="/profile" className="link">
                <FaUserCircle className="me-2" /> Profile
              </Dropdown.Item>

              <Dropdown.Item as={Link} to="/settings" className="link">
                <FaCog className="me-2" /> Settings
              </Dropdown.Item>

              <Dropdown.Divider />
              <Dropdown.Item className="text-danger" onClick={logout}>
                <FaSignOutAlt className="me-2" /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;
