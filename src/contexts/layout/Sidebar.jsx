import { useState } from "react";
import { Nav, Button } from "react-bootstrap";
import { useAuth } from "../AuthContext";
import { Link, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaCog, FaFileAlt, FaHome, FaSignOutAlt, FaUsers, FaBars } from "react-icons/fa";
import './style.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const menuItems = [
        { to: '/', icon: <FaHome />, label: 'Dashboard', roles: ['admin', 'manager', 'employee', 'hr'] },
        { to: '/employees', icon: <FaUsers />, label: 'Employees', roles: ['admin', 'manager', 'hr'] },
        { to: '/attendance', icon: <FaCalendarAlt />, label: 'Attendance', roles: ['admin', 'manager', 'employee', 'hr'] },
        { to: '/departments', icon: <FaCalendarAlt />, label: 'Department', roles: ['admin', 'manager', 'hr'] },
        { to: '/leaves', icon: <FaFileAlt />, label: 'Leaves', roles: ['admin', 'manager', 'employee', 'hr'] },
        { to: '/tasks', icon: <FaCalendarAlt />, label: 'Tasks', roles: ['admin', 'manager', 'employee'] },
        { to: '/eod-report', icon: <FaCalendarAlt />, label: 'EOD Report', roles: ['admin', 'manager', 'employee', 'hr'] },
        { to: '/notifications', icon: <FaCalendarAlt />, label: 'Notifications', roles: ['admin', 'manager', 'employee', 'hr'] },
        { to: '/settings', icon: <FaCog />, label: 'Settings', roles: ['admin', 'hr'] },
    ];

    if (!user) return null;

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user.role?.split('_')[1].toLowerCase() || 'guest')
    );

    return (
        <>
           
            <Button 
                variant="primary" 
                className="d-lg-none m-2"
                onClick={toggleSidebar}
            >
                <FaBars />
            </Button>

            
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand p-3">
                    <h3 className="text-white mb-0">HRM System</h3>
                </div>

                <Nav className="flex-column p-3 flex-grow-1">
                    {filteredMenuItems.map((item, index) => (
                        <Nav.Item key={index} className="mb-2">
                            <Nav.Link
                                as={Link}
                                to={item.to}
                                onClick={() => setIsOpen(false)} 
                                className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
                            >
                                <span className="me-2">{item.icon}</span>
                                {item.label}
                            </Nav.Link>
                        </Nav.Item>
                    ))}

                    <Nav.Item className="mt-auto">
                        <Nav.Link className="sidebar-link text-danger" onClick={logout}>
                            <span className="me-2"><FaSignOutAlt /></span>
                            Logout
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>
        </>
    );
};

export default Sidebar;
