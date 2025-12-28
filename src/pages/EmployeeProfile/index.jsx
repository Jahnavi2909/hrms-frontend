import { Card, Col, ProgressBar, Row, Tab, Tabs } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaCamera,
  FaClock,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaUserTag,
  FaUserTie
} from "react-icons/fa";
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
  const [liveWorked, setLiveWorked] = useState({});
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  /* ================= FETCH EMPLOYEE ================= */

  useEffect(() => {
    if (!id && !user?.employeeId) return;

    const fetchEmployeeData = async () => {
      try {
        const empId = id || user.employeeId;

        const response = await employeeApi.getById(empId);
        setEmployee(response.data.data);

        const attendanceRes = await attendanceApi.getAttendanceHistory(empId);
        setAttendance(attendanceRes.data.data || []);
      } catch (err) {
        setError("Failed to load employee data");
        console.error(err);
      }
    };

    fetchEmployeeData();
  }, [id, user]);

  /* ================= LIVE WORK TIMER ================= */

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

  /* ================= HELPERS ================= */

  const formatTime = iso =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "--:--";

  const formatHoursWorked = time => {
    if (!time) return "00 hrs 00 min";
    const [h, m] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")} hrs ${String(m).padStart(
      2,
      "0"
    )} min`;
  };

  /* ================= AVATAR ================= */

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      const res = await employeeApi.uploadAvatar(
        id || user.employeeId,
        formData
      );

      setEmployee(prev => ({
        ...prev,
        avatar: res.data.data.avatar
      }));
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      fileInputRef.current.value = "";
    }
  };

  /* ================= TIMELINE ================= */

  const Timeline = ({ rec }) => {
    const worked = rec.checkOutTime ? rec.workedTime : liveWorked[rec.id];
    const hoursWorked = worked ? parseInt(worked.split(":")[0]) : 0;
    const percent = Math.min((hoursWorked / SHIFT_HOURS) * 100, 100);

    return (
      <div className="mt-1">
        <small className="text-muted">
          {formatTime(rec.checkInTime)} →{" "}
          {rec.checkOutTime ? formatTime(rec.checkOutTime) : "Now"}
        </small>
        <ProgressBar
          now={percent}
          variant={percent < 50 ? "danger" : "success"}
        />
      </div>
    );
  };

  /* ================= UI ================= */

  return (
    <div className="employee-profile">
      {error && <p className="text-danger">{error}</p>}

      <div className="profile-header">
        <div className="profile-cover"></div>

        <div className="profile-info">
          <div
            className="profile-avatar d-flex flex-column avatar"
            onClick={handleAvatarClick}
          >
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt="Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                {`${employee?.firstName?.[0] || ""}${
                  employee?.lastName?.[0] || ""
                }`.toUpperCase()}
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
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-muted">{employee.designation}</p>
            <div className="employee-meta">
              <span>
                <FaIdCard className="me-2" />
                Employee ID: {employee.employeeId || "N/A"}
              </span>
              <span>
                <FaUserTie className="me-2" />
                {employee.departmentName || "N/A"}
              </span>
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
                  <Row>
                    <Col md={6}>
                      <FaUser /> <strong>First Name:</strong>
                      <p>{employee.firstName || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <FaUserTag /> <strong>Last Name:</strong>
                      <p>{employee.lastName || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <FaEnvelope /> <strong>Email:</strong>
                      <p>{employee.email || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <FaPhone /> <strong>Phone:</strong>
                      <p>{employee.phone || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <FaCalendarAlt /> <strong>Joining Date:</strong>
                      <p>
                        {employee.joiningDate
                          ? new Date(
                              employee.joiningDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </Col>
                    <Col md={6}>
                      <FaMapMarkerAlt /> <strong>Address:</strong>
                      <p>{employee.address || "N/A"}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Header>Quick Stats</Card.Header>
                <Card.Body>
                  <FaClock /> Total Working Days
                  <p>
                    {
                      attendance.filter(
                        a =>
                          a.attendanceStatus === "PRESENT" ||
                          a.attendanceStatus === "HALF_DAY"
                      ).length
                    }{" "}
                    days
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="attendance" title="Attendance">
          <Card className="mt-4">
            <Card.Header>Attendance History</Card.Header>
            <Card.Body>
              {attendance.length ? (
                attendance.map((rec, idx) => (
                  <div key={idx}>
                    {new Date(rec.date).toLocaleDateString()} —{" "}
                    {formatHoursWorked(
                      rec.checkOutTime
                        ? rec.workedTime
                        : liveWorked[rec.id]
                    )}
                    <Timeline rec={rec} />
                  </div>
                ))
              ) : (
                <p>No attendance records</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default EmployeeProfile;
