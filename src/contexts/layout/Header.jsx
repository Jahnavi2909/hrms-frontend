import { useState, useEffect } from "react";
import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { FaBell, FaCog, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import "./style.css";
import { notificationApi } from "../../services/api";
import { Link } from "react-router-dom";

const Header = () => {
    const { user, logout } = useAuth();

    const [notificationsCount, setNotificationsCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        fetchUnreadNotificationCount();

        const interval = setInterval(() => {
            fetchUnreadNotificationCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (!user) return null;

    // FETCH UNREAD NOTIFICATIONS
    const fetchUnreadNotificationCount = async () => {
        try {
            setLoadingNotifications(true);
            const res = await notificationApi.getUnreadNotifications();
            const unreadList = res?.data?.data || [];
            setNotificationsCount(unreadList.length);
        } catch (err) {
            console.error("Error loading notifications:", err);
        } finally {
            setLoadingNotifications(false);
        }
    };


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

                            {loadingNotifications ? (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
                                    ...
                                </span>
                            ) : notificationsCount > 0 ? (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {notificationsCount}
                                </span>
                            ) : null}
                        </Nav>
                    </Link>

                    {/* PROFILE */}
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="light"
                            className="bg-transparent border-0 d-flex align-items-center"
                        >
                            <div className="d-flex align-items-center">
                                <div className="me-2 text-end d-none d-md-block">
                                    <div className="fw-medium">{user?.employee.firstName}</div>
                                    <small className="text-muted">{user?.role?.replace("ROLE_", "")}</small>
                                </div>
                                <div className="avatar-circle bg-primary text-white">
                                    {user?.employee.firstName ? user.employee.firstName[0] : "U"}
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="dropdown-menu-end shadow-sm border-0">
                            <Dropdown.Header className="bg-light">
                                <h6 className="mb-0">{user?.employee.firstName}</h6>
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
