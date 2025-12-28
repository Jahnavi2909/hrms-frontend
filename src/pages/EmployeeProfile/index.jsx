import { Card, Col, ProgressBar, Row, Tab, Tabs } from "react-bootstrap";
import { FaCalendarAlt, FaCamera, FaClock, FaEnvelope, FaIdCard, FaMapMarkerAlt, FaPhone, FaUser, FaUserTag, FaUserTie } from "react-icons/fa";
import { attendanceApi, employeeApi } from "../../services/api";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";



const SHIFT_HOURS = 8;

const EmployeeProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [forceReload, setForceReload] = useState(false);
  const [liveWorked, setLiveWorked] = useState({});
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);


  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await employeeApi.getById(id || user.employeeId);
        setEmployee(response.data.data);

        const attendanceRes = await attendanceApi.getAttendanceHistory(id || user.employeeId);
        setAttendance(attendanceRes.data.data || []);
      } catch (error) {
        setError("Failed to load employee data");
        console.error("Error fetching employee data:", error);
      }
    };
    fetchEmployeeData();
  }, [id, user.employeeId]);


  useEffect(() => {
    const timer = setInterval(() => {
      const updated = {};
      attendance.forEach(r => {
        if (r.checkInTime && !r.checkOutTime) {
          const start = new Date(r.checkInTime);
          const now = new Date();
          const mins = Math.floor((now - start) / 60000);
          const h = String(Math.floor(mins / 60)).padStart(2, "0");
          const m = String(mins % 60).padStart(2, "0");
          updated[r.id] = `${h}:${m}`;
        }
      });
      setLiveWorked(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [attendance]);

  /* ---------------- AUTO REFRESH ---------------- */

  useEffect(() => {
    const h = () => setForceReload(p => !p);
    window.addEventListener("attendance-updated", h);
    return () => window.removeEventListener("attendance-updated", h);
  }, []);

  const formatTime = (iso) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatHoursWorked = (time) => {
    if (!time) return "00 hrs 00 min";
    const [h, m] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")} hrs ${String(m).padStart(2, "0")} min`;
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };


  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      const res = await employeeApi.uploadAvatar(id || user.employeeId, formData);
      setEmployee(prev => ({ ...prev, avatar: res.data.data.avatar }));
    } catch (err) {
      alert("Failed to upload image");
      setUploading(false);
    }
  };


  const Timeline = ({ rec }) => {
    const worked = rec.checkOutTime ? rec.workedTime : liveWorked[rec.id];
    const hoursWorked = worked ? parseInt(worked.split(":")[0]) : 0;
    const percent = Math.min((hoursWorked / SHIFT_HOURS) * 100, 100);

    return (
      <div className="mt-1">
        <small className="text-muted">
          {formatTime(rec.checkInTime)} → {rec.checkOutTime ? formatTime(rec.checkOutTime) : "Now"}
        </small>
        <ProgressBar now={percent} variant={percent < 50 ? "danger" : "success"} />
      </div>
    );
  };

  return (
    <div className="employee-profile">
      {error && <p className="text-danger">{error}</p>}

      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-info">
          <div className="profile-avatar d-flex flex-column avatar" onClick={handleAvatarClick}>
            {employee.avatar ? (
              <div className="d-flex align-items-center gap-2">
                <img
                  src={employee.avatar || "/profile.jpg"}
                  alt="Profile"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover"
                  }}
                />
                {employee.avatar && (
                  <button
                    className="btn btn-danger btn-sm ms-2"
                  // onClick={handleDeleteAvatar}
                  >
                    Delete
                  </button>
                )}
              </div>




            ) : (
              <div className="avatar-placeholder">
                {`${employee?.firstName?.[0] || ""}${employee?.lastName?.[0] || ""}`.toUpperCase()}
              </div>
            )}

            <div className="avatar-overlay">
              <FaCamera />
              <span>{uploading ? "Uploading..." : "Change"}</span>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              hidden
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="profile-meta">
            <h2>{employee.firstName || `${employee?.firstName || ""} ${employee.lastName || ""}`}</h2>
            <p className="text-muted">{employee.designation}</p>
            <div className="employee-meta">
              <span><FaIdCard className="me-2" /> Employee ID: {employee.employeeId || "N/A"}</span>
              <span><FaUserTie className="me-2" /> {employee.departmentName || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs className="mb-4 profile-tabs">
        <Tab eventKey="profile" title="Profile">
          <Row className="mt-4">
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>Personal Information</Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1"><FaUser className="me-2" /> <strong>First Name:</strong></p>
                      <p>{employee.firstName || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><FaUserTag className="me-2" /> <strong>Last Name:</strong></p>
                      <p>{employee.lastName || "N/A"}</p>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1"><FaEnvelope className="me-2" /> <strong>Email:</strong></p>
                      <p>{employee.email || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><FaPhone className="me-2" /> <strong>Phone:</strong></p>
                      <p>{employee.phone || "N/A"}</p>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1"><FaCalendarAlt className="me-2" /> <strong>Joining Date:</strong></p>
                      <p>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><FaCalendarAlt className="me-2" /> <strong>Date of Birth:</strong></p>
                      <p>{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><FaMapMarkerAlt className="me-2" /> <strong>Address:</strong></p>
                      <p>{employee.address || "N/A"}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>Quick Stats</Card.Header>
                <Card.Body>
                  <div className="stat-item">
                    <FaClock className="me-2" />
                    <div>
                      <h6>Total Working Days</h6>
                      {
                        () => {

                        }
                      }
                      <p className="mb-0">{attendance.filter(a => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'HALF_DAY').length} days</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="attendance" title="Attendance">
          <Card className="mt-4">
            <Card.Header>Attendance History</Card.Header>
            <Card.Body>
              {/* Desktop Table */}
              <div className="table-responsive d-none d-md-block">
                {attendance.length > 0 ? (
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
                      {attendance.map((record, idx) => (
                        <tr key={idx}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge bg-${record.attendanceStatus === 'PRESENT' ? 'success' : 'danger'}`}>
                              {record.attendanceStatus}
                            </span>
                          </td>
                          <td>{formatTime(record.checkInTime)}</td>
                          <td>{formatTime(record.checkOutTime)}</td>
                          <td>
                            <div className="field">
                              <div className="value">
                                {record.checkOutTime
                                  ? formatHoursWorked(record.workedTime)
                                  : formatHoursWorked(liveWorked[record.id])}
                              </div>
                              <Timeline rec={record} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No attendance records found</p>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="d-block d-md-none">
                {attendance.length > 0 ? (
                  attendance.map((record, idx) => (
                    <div className="attendance-card p-3 mb-3 border rounded" key={idx}>
                      <div className="d-flex justify-content-between mb-2">
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`badge bg-${record.attendanceStatus === 'PRESENT' ? 'success' : 'danger'}`}>
                          {record.attendanceStatus}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div>Check In: {formatTime(record.checkInTime)}</div>
                        <div>Check Out: {formatTime(record.checkOutTime)}</div>
                      </div>
                      <div className="mt-2">Hours Worked: {record.hoursWorked || '--'}</div>
                    </div>
                  ))
                ) : (
                  <p>No attendance records found</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default EmployeeProfile;
