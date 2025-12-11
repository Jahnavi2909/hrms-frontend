
import {
  Button, Card, Col, Container, Row, Spinner, Tab, Tabs, Collapse
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt, FaChartLine, FaUsers, FaUserTie, FaEdit, FaTrash, FaUserPlus
} from "react-icons/fa";
import { attendanceApi, employeeApi, leaveApi } from "../../services/api";
import EmployeeForm from "../Employee/EmployeeForm";
import "./style.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrHr = ["ROLE_ADMIN", "ROLE_HR"].includes(user?.role);
  const canCheckAttendance = ["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE"].includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, onLeave: 0, departments: 0
  });

  const [employeeDashboard, setEmployeeDashboard] = useState({
    checkIn: null, checkOut: null, leaveUsed: 0, leaveTotal: 0
  });

  const [employees, setEmployees] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

 
  // Load Dashboard
 
  useEffect(() => {
    if (!user) return;
    if (isAdminOrHr) loadAdminDashboard();
    if (canCheckAttendance) loadEmployeeDashboard();
  }, [user]);


  // Admin/HR Dashboard
  
  const loadAdminDashboard = async () => {
    try {
      const [empRes, todayRes] = await Promise.all([
        employeeApi.getAllEmployee(),
        attendanceApi.getTodayAttendance()
      ]);

      const empList = empRes.data?.data || [];
      const attendance = todayRes.data?.data || [];

      setEmployees(empList);

      setStats({
        totalEmployees: empList.length,
        presentToday: attendance.filter(a => a.attendanceStatus === "PRESENT" || a.attendanceStatus === "HALF_DAY").length,
        onLeave: attendance.filter(a => a.attendanceStatus === "ON_LEAVE").length,
        departments: new Set(empList.map(e => e.departmentName)).size
      });

    } catch (err) {
      console.error("Admin Dashboard Error:", err);
    }
    setLoading(false);
  };

  // Employee / Manager / Admin own dashboard
  
  const loadEmployeeDashboard = async () => {
    try {
      const employeeId = user.employeeId;
      if (!employeeId) return;

      const attendanceRes = await attendanceApi.getTodayAttendanceByEmployee(employeeId);
      const leaveRes = await leaveApi.getByEmployee(employeeId);

      const today = attendanceRes.data?.data;
      const leave = leaveRes.data?.data;

      setEmployeeDashboard({
        checkIn: today?.checkInTime || null,
        checkOut: today?.checkOutTime || null,
        leaveUsed: leave?.used || 0,
        leaveTotal: leave?.total || 20
      });
    } catch (err) {
      console.error("Employee Dashboard Error:", err);
    }
    setLoading(false);
  };


  // Check-in / Check-out (only for logged-in user)
 
  const handleCheckIn = async () => {
    try {
      await attendanceApi.checkIn(user.employeeId);
      await loadEmployeeDashboard();
      if (isAdminOrHr) await loadAdminDashboard();
    } catch (err) {
      console.error(err);
      alert("Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut(user.employeeId);
      await loadEmployeeDashboard();
      if (isAdminOrHr) await loadAdminDashboard();
    } catch (err) {
      console.error(err);
      alert("Check-out failed");
    }
  };

 
  // Handle Edit / Delete Employee
 
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setOpenForm(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await employeeApi.delete(id);
      setEmployees(employees.filter(e => e.id !== id));
      alert("Employee deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee.");
    }
  };

  
  // Admin/HR View
  
  const renderAdminView = () => (
    <>
      {/* CHECK-IN / CHECK-OUT FOR HR / ADMIN / MANAGER */}
      {canCheckAttendance && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Your Attendance</h6>
            <p>{employeeDashboard.checkIn ? `Checked in at: ${employeeDashboard.checkIn}` : "Not checked in yet"}</p>
            <p>{employeeDashboard.checkOut ? `Checked out at: ${employeeDashboard.checkOut}` : ""}</p>

            {!employeeDashboard.checkIn && (
              <Button className="me-2" onClick={handleCheckIn}>✔ Check In</Button>
            )}
            {employeeDashboard.checkIn && !employeeDashboard.checkOut && (
              <Button variant="danger" className="me-2" onClick={handleCheckOut}>⛔ Check Out</Button>
            )}
            {employeeDashboard.checkIn && employeeDashboard.checkOut && (
              <span className="text-success">✔ Attendance completed for today</span>
            )}
          </Card.Body>
        </Card>
      )}

      <Tabs className="mb-4">
        <Tab eventKey="overview" title={<span><FaChartLine /> Overview</span>}>
          <div className="mt-4">
            <h4>Quick Stats</h4>
            <Row className="g-4 mt-2">
              <Col md={3}><Card className="stat-card"><Card.Body><h6>Total Employees</h6><h3>{stats.totalEmployees}</h3></Card.Body></Card></Col>
              <Col md={3}><Card className="stat-card"><Card.Body><h6>Present Today</h6><h3>{stats.presentToday}</h3></Card.Body></Card></Col>
              <Col md={3}><Card className="stat-card"><Card.Body><h6>On Leave</h6><h3>{stats.onLeave}</h3></Card.Body></Card></Col>
              <Col md={3}><Card className="stat-card"><Card.Body><h6>Departments</h6><h3>{stats.departments}</h3></Card.Body></Card></Col>
            </Row>
          </div>
        </Tab>

        <Tab eventKey="employees" title={<span><FaUsers /> Employees</span>}>
          <div className="mt-4">
            <div className="d-flex justify-content-between mb-3">
              <h4>Employee Management</h4>
              <Button variant="primary" onClick={() => { setOpenForm(!openForm); setEditingEmployee(null); }}>
                <FaUserPlus className="me-2" />
                {openForm ? "Close Form" : "Add Employee"}
              </Button>
            </div>

            <Collapse in={openForm}>
              <div>
                <EmployeeForm
                  editingEmployee={editingEmployee}
                  onCancel={() => { setOpenForm(false); setEditingEmployee(null); }}
                  onSubmit={async (data) => {
                    try {
                      if (editingEmployee) await employeeApi.update(editingEmployee.id, data);
                      else await employeeApi.create(data);
                      await loadAdminDashboard();
                      setOpenForm(false);
                      setEditingEmployee(null);
                    } catch (err) {
                      console.error(err);
                      alert("Failed to save employee.");
                    }
                  }}
                />
              </div>
            </Collapse>

            <Card className="mt-3">
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Joining Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.length ? employees.map(emp => (
                        <tr key={emp.id}>
                          <td>{emp.firstName} {emp.lastName}<br/><small>{emp.email}</small></td>
                          <td>{emp.designation}</td>
                          <td>{emp.departmentName}</td>
                          <td>{emp.status || "ACTIVE"}</td>
                          <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}</td>
                          <td>
                            <Button variant="link" size="sm" onClick={() => handleEditEmployee(emp)}><FaEdit /></Button>
                            <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteEmployee(emp.id)}><FaTrash /></Button>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="6" className="text-center">No employees found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Tab>

        <Tab eventKey="attendance" title={<span><FaCalendarAlt /> Attendance</span>}>
          <Card className="mt-4">
            <Card.Body className="text-center py-5">
              <h5>Attendance Management</h5>
              <Button onClick={() => navigate("/attendance")}>View Attendance</Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </>
  );

  
  // Employee View

  const renderEmployeeView = () => (
    <div className="employee-dashboard">
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <h4>Welcome back, {user.employee?.firstName}</h4>

              {canCheckAttendance && (
                <Card className="mb-3">
                  <Card.Body>
                    <h6>Your Attendance</h6>
                    <p>{employeeDashboard.checkIn ? `Checked in at: ${employeeDashboard.checkIn}` : "Not checked in yet"}</p>
                    <p>{employeeDashboard.checkOut ? `Checked out at: ${employeeDashboard.checkOut}` : ""}</p>

                    {!employeeDashboard.checkIn && (
                      <Button className="me-2" onClick={handleCheckIn}>✔ Check In</Button>
                    )}
                    {employeeDashboard.checkIn && !employeeDashboard.checkOut && (
                      <Button variant="danger" className="me-2" onClick={handleCheckOut}>⛔ Check Out</Button>
                    )}
                    {employeeDashboard.checkIn && employeeDashboard.checkOut && (
                      <span className="text-success">✔ Attendance completed for today</span>
                    )}
                  </Card.Body>
                </Card>
              )}

              <Row className="mt-4">
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Leave Balance</h6>
                      <p>{employeeDashboard.leaveUsed} / {employeeDashboard.leaveTotal} used</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Quick Links</h5>
              <Button className="w-100" onClick={() => navigate(`/employees/${user.employeeId}`)}>
                <FaUserTie /> My Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );


  // Main render
 
  if (loading || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>{isAdminOrHr ? "Admin Dashboard" : "My Dashboard"}</h2>
      </div>

      {isAdminOrHr ? renderAdminView() : renderEmployeeView()}
    </Container>
  );
};

export default Dashboard;
