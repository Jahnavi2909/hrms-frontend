import { Card, Col, Row, Tab, Tabs } from "react-bootstrap";
import { FaCalendarAlt, FaClock, FaEnvelope, FaIdCard, FaMapMarkerAlt, FaPhone, FaUser, FaUserTag, FaUserTie } from "react-icons/fa";
import { attendanceApi, employeeApi } from "../../services/api";
import { use, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

const EmployeeProfile = () => {
    
    const {id} = useParams();
    const {user} = useAuth();
    const [error, setError] = useState('');
    const [employee, setEmployee] = useState([]);
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const response = await employeeApi.getById(id);
                console.log(response)
                setEmployee(response.data.data);

                const attendanceRes = await attendanceApi.getAttendanceHistory(id);
                console.log(attendanceRes.data.data)
                setAttendance(attendanceRes.data.data || []);
            } catch (error) {
                setError('Failed to load employee data');
                console.error("Error fetching employee data:", error);
            }
        }
        fetchEmployeeData()
    },[id])

    const formatTime = (isoString) => {
        if (!isoString) return "--:--";
        return isoString.split("T")[1]?.split(".")[0] || "--:--";
    };

    return (
        <div className="employee-profile">
            <div className="profile-header">
                <div className="profile-cover"></div>
                <div className="profile-info">
                    <div className="profile-avatar">
                        {employee.avatar ||
                            <div className="avatar-placeholder">
                                {employee.firstName?.split(' ').map(n => n[0]).join('')}
                            </div>
                        }
                    </div>
                    <div className="profile-meta">
                        <h2>{employee.name}</h2>
                        <p className="text-muted">{employee.designation}</p>
                        <div className="employee-meta">
                            <span><FaIdCard className="me-2" /> Employee ID: {employee.employeeId || 'N/A'}</span>
                            <span><FaUserTie className="me-2" /> {employee.department}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs
                // activeKey={activeTab}
                // onSelect={(k) => setActiveTab(k)}
                className="mb-4 profile-tabs"
            >
                <Tab eventKey="profile" title="Profile">
                    <Row className="mt-4">
                        <Col md={8}>
                            <Card className="mb-4">
                                <Card.Header as="h5">Personal Information</Card.Header>
                                <Card.Body>
                                     <Row className="mb-3">
                                        <Col md={6}>
                                            <p className="mb-2"><FaUser className="me-2" /> <strong>First Name:</strong></p>
                                            <p>{employee.firstName || user.username.split(" ")[0] || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><FaUserTag className="me-2" /> <strong>Last Name:</strong></p>
                                            <p>{employee.firstName || user.username.split(" ")[1] || 'N/A'}</p>
                                        </Col>
                                    </Row>  
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <p className="mb-2"><FaEnvelope className="me-2" /> <strong>Email:</strong></p>
                                            <p>{employee.email || user.email || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><FaPhone className="me-2" /> <strong>Phone:</strong></p>
                                            <p>{employee.phone || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2"><FaCalendarAlt className="me-2" /> <strong>Date of Joining:</strong></p>
                                            <p>{new Date(employee.joiningDate).toLocaleDateString()}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><FaCalendarAlt className="me-2" /> <strong>Date of Birth:</strong></p>
                                            <p>{new Date(employee.dateOfBirth).toLocaleDateString()}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><FaMapMarkerAlt className="me-2" /> <strong>Address:</strong></p>
                                            <p>{employee.address || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="mb-4">
                                <Card.Header as="h5">Quick Stats</Card.Header>
                                <Card.Body>
                                    <div className="stat-item">
                                        <FaClock className="me-2" />
                                        <div>
                                            <h6>Total Working Days</h6>
                                            <p className="mb-0">{attendance.filter(a => a.status === 'PRESENT').length} days</p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="attendance" title="Attendance">
                    <Card className="mt-4">
                        <Card.Header as="h5">Attendance History</Card.Header>
                        <Card.Body>
                            {attendance.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Check In</th>
                                                <th>Check Out</th>
                                                <th>Hours Worked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendance.map((record, index) => (
                                                <tr key={index}>
                                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge bg-${record.status === 'PRESENT' ? 'success' : 'danger'}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td>{formatTime(record.checkInTime) || '--:--'}</td>
                                                    <td>{formatTime(record.checkOutTime) || '--:--'}</td>
                                                    <td>{record.hoursWorked || '--'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No attendance records found</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    )
}

export default EmployeeProfile;