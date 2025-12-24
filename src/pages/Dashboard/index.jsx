
import {
  Button, Card, Col, Container, Row, Spinner, Tab, Tabs, Collapse
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt, FaChartLine, FaUsers, FaUserTie, FaEdit, FaTrash, FaUserPlus
} from "react-icons/fa";
import { API_BASE_URL, attendanceApi, employeeApi, leaveApi, taskApi } from "../../services/api";
import EmployeeForm from "../Employee/EmployeeForm";
import "./style.css";
import useAutoCheckout from "../../contexts/layout/AutoCheckout";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrHr = ["ROLE_ADMIN", "ROLE_HR"].includes(user?.role);
  const canCheckAttendance = ["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE"].includes(user?.role);
  const [workTimer, setWorkTimer] = useState("00:00:00");


  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, onLeave: 0, departments: 0
  });

  const [employeeDashboard, setEmployeeDashboard] = useState({
    checkIn: null,
    checkOut: null,
    leaveUsed: 0,
    leaveRemaining: 0,
    leaveTotal: 0,
    leaveApproved: 0,
    leaveRejected: 0
  });

  const [todayTasks, setTodayTasks] = useState([]);



  const [employees, setEmployees] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useAutoCheckout();

  useEffect(() => {
    if (!user) return;
    if (isAdminOrHr) loadAdminDashboard();
    if (canCheckAttendance) loadEmployeeDashboard();
  }, [user]);


  useEffect(() => {
    let interval;

    if (employeeDashboard.checkIn && !employeeDashboard.checkOut) {
      const checkInTime = new Date(employeeDashboard.checkIn);

      interval = setInterval(() => {
        const now = new Date();
        const diff = now - checkInTime;

        const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

        setWorkTimer(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }

    if (employeeDashboard.checkOut) {
      const checkIn = new Date(employeeDashboard.checkIn);
      const checkOut = new Date(employeeDashboard.checkOut);
      const diff = checkOut - checkIn;

      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

      setWorkTimer(`${hours}:${minutes}:${seconds}`);
    }

    return () => clearInterval(interval);
  }, [employeeDashboard.checkIn, employeeDashboard.checkOut]);


  const calculateLeaveStats = (leaves = [], totalLeaves = 20) => {
    let approved = 0;
    let rejected = 0;
    let pending = 0;

    leaves.forEach(leave => {
      if (leave.status === "APPROVED") {
        approved += leave.days;
      } else if (leave.status === "REJECTED") {
        rejected += leave.days;
      } else if (leave.status === "PENDING") {
        pending += leave.days;
      }
    });

    return {
      approved,
      rejected,
      pending,
      used: approved,
      remaining: Math.max(totalLeaves - approved, 0),
      total: totalLeaves
    };
  };




  // Admin or HR Dashboard

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

  // Employee or Manager or Admin own dashboard
  const loadEmployeeDashboard = async () => {
    try {
      const employeeId = user.employeeId;
      if (!employeeId) return;

      const attendanceRes = await attendanceApi.getTodayAttendanceByEmployee(employeeId);
      const leaveRes = await leaveApi.getByEmployee(employeeId);
      const taskRes = await taskApi.getByEmployee(employeeId); // 👈 ADD THIS

      const today = attendanceRes.data?.data;
      const leaves = leaveRes.data?.data || [];
      const tasks = taskRes.data?.data || [];

      // ---- TODAY FILTER ----
      const todayDate = new Date().toISOString().split("T")[0];
      const todayTaskList = tasks.filter(
        task => task.dueDate === todayDate
      );

      setTodayTasks(todayTaskList);

      const leaveStats = calculateLeaveStats(leaves, 20);

      setEmployeeDashboard({
        checkIn: today?.checkInTime || null,
        checkOut: today?.checkOutTime || null,
        leaveUsed: leaveStats.used,
        leaveRemaining: leaveStats.remaining,
        leaveTotal: leaveStats.total,
        leaveApproved: leaveStats.approved,
        leaveRejected: leaveStats.rejected
      });

    } catch (err) {
      console.error("Employee Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
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


  // Handle Edit or Delete Employee

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


  // Admin or HR View

  const renderAdminView = () => (
    <>
      {canCheckAttendance && !(user?.role === "ROLE_ADMIN") && (
        <Card className="attendance-card mb-4">
          <Card.Body className="text-center">

            <h6 className="text-muted mb-1">Today's Work Duration</h6>

            <div className="work-timer">
              {employeeDashboard.checkIn ? workTimer : "00:00:00"}
            </div>

            <div className="mt-2 text-muted small">
              {employeeDashboard.checkIn
                ? `Checked in at ${new Date(employeeDashboard.checkIn).toLocaleTimeString()}`
                : "You haven't checked in yet"}
            </div>

            {employeeDashboard.checkOut && (
              <div className="text-muted small">
                Checked out at {new Date(employeeDashboard.checkOut).toLocaleTimeString()}
              </div>
            )}

            <div className="mt-4 d-flex justify-content-center gap-3">
              {!employeeDashboard.checkIn && (
                <Button className="check-btn check-in" onClick={handleCheckIn}>
                  ✔ Check In
                </Button>
              )}

              {employeeDashboard.checkIn && !employeeDashboard.checkOut && (
                <Button className="check-btn check-out" onClick={handleCheckOut}>
                  ⛔ Check Out
                </Button>
              )}

              {employeeDashboard.checkIn && employeeDashboard.checkOut && (
                <span className="text-success fw-semibold">
                  ✔ Attendance completed
                </span>
              )}
            </div>

          </Card.Body>
        </Card>

      )}

      <Tabs className="mb-4">
        <Tab eventKey="overview" title={<span><FaChartLine /> Overview</span>}>
          <div className="mt-4">
            <h4>Quick Stats</h4>
            <Row className="g-4 mt-2">
              <Col md={3}>
                <Link to={"/employees"} className="link">
                  <Card className="stat-card"><Card.Body><h6>Total Employees</h6><h3>{stats.totalEmployees}</h3></Card.Body></Card>
                </Link>
              </Col>
              <Col md={3}>
                <Link to={"/attendance"} className="link">
                  <Card className="stat-card"><Card.Body><h6>Present Today</h6><h3>{stats.presentToday}</h3></Card.Body></Card>
                </Link>
              </Col>
              <Col md={3}>
                <Link to={"/leaves"} className="link">
                  <Card className="stat-card"><Card.Body><h6>On Leave</h6><h3>{stats.onLeave}</h3></Card.Body></Card>
                </Link>
              </Col>
              <Col md={3}>
                <Link to={"/employees"} className="link">
                  <Card className="stat-card"><Card.Body><h6>Departments</h6><h3>{stats.departments}</h3></Card.Body></Card>
                </Link>
              </Col>

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
                {/* Desktop Table */}
                <div className="d-none d-md-block">
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
                          <tr key={emp.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/employees/${emp.id}`)}
                          >
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={emp.avatar ? `${API_BASE_URL}${emp.avatar}` : "/profile.jpg"}
                                  alt="Avatar"
                                  style={{ width: 50, height: 50, borderRadius: "50%" }}
                                />
                                <div>
                                  <div className="fw-semibold">{emp.firstName} {emp.lastName}</div>
                                  <small className="text-muted">{emp.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>{emp.designation}</td>
                            <td>{emp.departmentName}</td>
                            <td>{emp.status || "ACTIVE"}</td>
                            <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}</td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEmployee(emp);
                                }}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(emp.id);
                                }}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" className="text-center">No employees found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile Cards */}
                <div className="d-block d-md-none">
                  {employees.length ? employees.map(emp => (
                    <Card key={emp.id} className="mb-3 shadow-sm"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={emp.avatar ? `${API_BASE_URL}${emp.avatar}` : "/profile.jpg"}
                            alt="Avatar"
                            style={{ width: 60, height: 60, borderRadius: "50%", marginRight: 12 }}
                          />
                          <div>
                            <div className="fw-bold">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <small className="text-muted">{emp.email}</small>
                          </div>
                        </div>

                        <div className="small text-muted mb-1">
                          <strong>Designation:</strong> {emp.designation || "—"}
                        </div>

                        <div className="small text-muted mb-1">
                          <strong>Department:</strong> {emp.departmentName || "—"}
                        </div>

                        <div className="small text-muted mb-1">
                          <strong>Status:</strong>{" "}
                          <span className={`badge ${emp.status === "INACTIVE" ? "bg-danger" : "bg-success"}`}>
                            {emp.status || "ACTIVE"}
                          </span>
                        </div>

                        <div className="small text-muted mb-3">
                          <strong>Joined:</strong>{" "}
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(emp);
                            }}
                          >
                            <FaEdit />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEmployee(emp.id);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )) : (
                    <div className="text-center text-muted">No employees found.</div>
                  )}
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
    <div className="employee-dashboard fade-in">
      <Row>
        <Col md={4}>
          <Card className="attendance-card mb-4 animated-card">
            <Card.Body className="text-center">

              <h6 className="text-muted mb-1">Today's Work Duration</h6>

              <div className="work-timer pulse">
                {employeeDashboard.checkIn ? workTimer : "00:00:00"}
              </div>

              <div className="mt-2 text-muted small">
                {employeeDashboard.checkIn
                  ? `Checked in at ${new Date(employeeDashboard.checkIn).toLocaleTimeString()}`
                  : "You haven't checked in yet"}
              </div>

              {employeeDashboard.checkOut && (
                <div className="text-muted small">
                  Checked out at {new Date(employeeDashboard.checkOut).toLocaleTimeString()}
                </div>
              )}

              <div className="mt-4 d-flex justify-content-center gap-3">
                {!employeeDashboard.checkIn && (
                  <Button className="check-btn check-in" onClick={handleCheckIn}>
                    ✔ Check In
                  </Button>
                )}

                {employeeDashboard.checkIn && !employeeDashboard.checkOut && (
                  <Button className="check-btn check-out" onClick={handleCheckOut}>
                    ⛔ Check Out
                  </Button>
                )}

                {employeeDashboard.checkIn && employeeDashboard.checkOut && (
                  <span className="text-success fw-semibold">
                    ✔ Attendance completed
                  </span>
                )}
              </div>

            </Card.Body>
          </Card>

        </Col>

        <Col md={4}>
          <Link to={'/tasks'} className="link">
            <Card className="mb-4 shadow-sm animated-card">
              <Card.Body>
                <h6 className="text-muted mb-3">Today’s Tasks</h6>

                {todayTasks.length === 0 ? (
                  <div className="text-muted text-center small">
                    You don’t have any tasks today 🎉
                  </div>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {todayTasks.map(task => (
                      <li
                        key={task.id}
                        className="d-flex justify-content-between align-items-center mb-2 p-2 rounded bg-light"
                      >
                        <div>
                          <div className="fw-semibold">{task.title}</div>
                          <small className="text-muted">
                            Priority: {task.priority}
                          </small>
                        </div>

                        <span
                          className={`badge ${task.status === "COMPLETED"
                            ? "bg-success"
                            : "bg-warning text-dark"
                            }`}
                        >
                          {task.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </Link>
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
      <Row>

        <Col md={4} >
          <Card className="mb-4 shadow-sm animated-card">
            <Card.Body>
              <h6 className="text-muted">Today Summary</h6>

              <div className="d-flex justify-content-between mt-2">
                <span>Status</span>
                <span className="fw-bold text-success">
                  {employeeDashboard.checkIn ? "PRESENT" : "NOT CHECKED IN"}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span>Check In</span>
                <span>
                  {employeeDashboard.checkIn
                    ? new Date(employeeDashboard.checkIn).toLocaleTimeString()
                    : "--"}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span>Worked Time</span>
                <span className="fw-semibold">{workTimer}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} >
          <Card className="mb-4 shadow-sm animated-card">
            <Card.Body>
              <h6 className="text-muted">Leave Balance</h6>

              <div className="mt-2">
                <div className="d-flex justify-content-between">
                  <span>Used</span>
                  <strong>{employeeDashboard.leaveUsed}</strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span>Remaining</span>
                  <strong>{employeeDashboard.leaveRemaining}</strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span>Total</span>
                  <strong>{employeeDashboard.leaveTotal}</strong>
                </div>
              </div>

              <Button
                className="w-100 mt-3"
                variant="outline-primary"
                onClick={() => navigate("/leaves")}
              >
                Apply Leave
              </Button>
            </Card.Body>
          </Card>

          <hr />

          <div className="d-flex justify-content-between small text-muted">
            <span>Approved</span>
            <span className="text-success fw-semibold">
              {employeeDashboard.leaveApproved}
            </span>
          </div>

          <div className="d-flex justify-content-between small text-muted">
            <span>Rejected</span>
            <span className="text-danger fw-semibold">
              {employeeDashboard.leaveRejected}
            </span>
          </div>


        </Col>
        <Col>
          <Card className="shadow-sm animated-card">
            <Card.Body>
              <h6 className="text-muted">Quick Actions</h6>

              <div className="d-grid gap-2 mt-3">
                <Button variant="outline-secondary" onClick={() => navigate("/attendance")}>
                  <FaCalendarAlt className="me-2" /> My Attendance
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate("/leaves")}>
                  Leave History
                </Button>
              </div>
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
      <div className=" mb-4">
        <h2>
          Welcome, {user?.employee?.firstName || user?.username} {user?.employee?.lastName || ''}
        </h2>
        <p className="text-muted">
          {isAdminOrHr ? "You have administrative access" : "Here’s your activity overview"}
        </p>

      </div>

      {isAdminOrHr ? renderAdminView() : renderEmployeeView()}
    </Container>
  );
};

export default Dashboard;
