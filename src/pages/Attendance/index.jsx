import { useEffect, useState } from "react";
import { Card, Form, Table } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import { attendanceApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

const Attendance = () => {
    const { user } = useAuth();

    const [attendanceData, setAttendanceData] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [forceReload, setForceReload] = useState(false);

    const role = user.role;
    const employeeId = user.employeeId;

    const formatTime = (isoString) => {
        if (!isoString) return "--:--";
        return isoString.split("T")[1]?.split(".")[0] || "--:--";
    };

    const loadAttendance = async () => {
        try {
            let res;

            // EMPLOYEE SIDE
            if (role !== "ROLE_ADMIN" && role !== "ROLE_HR" && role !== "ROLE_MANAGER") {
                res = await attendanceApi.getAttendanceHistory(employeeId);

                const data = res.data.data || [];

                const filtered = data.filter(
                    (r) => r.date.split("T")[0] === date
                );

                setAttendanceData(filtered);
                return;
            }

            // ADMIN SIDE
            res = await attendanceApi.getAttendanceByDate(date);
            const records = res.data.data || [];

            const updated = records.map((r) => ({
                ...r,
                employeeName: r?.firstName + " " + r?.lastName,
                employeeCode: r?.employeeCode,
            }));

            setAttendanceData(updated);
        } catch (err) {
            console.error("Error loading attendance:", err);
        }
    };

    // Load when date or reload trigger changes
    useEffect(() => {
        loadAttendance();
    }, [date, forceReload]);

    // Listen for check-in/check-out event
    useEffect(() => {
        const handler = () => setForceReload((prev) => !prev);
        window.addEventListener("attendance-updated", handler);

        return () => window.removeEventListener("attendance-updated", handler);
    }, []);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>
                    {(role === "ROLE_ADMIN" || role === "ROLE_HR" || role === "ROLE_MANAGER")
                        ? "All Employees Attendance"
                        : "My Attendance"}
                </h1>

                <Form.Group className="d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">
                        <FaCalendarAlt className="me-1" /> Date:
                    </Form.Label>
                    <Form.Control
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ width: "auto" }}
                    />
                </Form.Group>
            </div>

            {/* EMPLOYEE TABLE */}
            {(role !== "ROLE_ADMIN" && role !== "ROLE_HR" && role !== "ROLE_MANAGER") && (
                <Card className="mt-4">
                    <Card.Header as="h5">Attendance on {date}</Card.Header>
                    <Card.Body>
                        {attendanceData.length > 0 ? (
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
                                        {attendanceData.map((record, index) => (
                                            <tr key={index}>
                                                <td>
                                                    {new Date(
                                                        record.date
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${record.attendanceStatus ===
                                                                "PRESENT"
                                                                ? "success"
                                                                : "danger"
                                                            }`}
                                                    >
                                                        {
                                                            record.attendanceStatus
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatTime(record.checkInTime) ||
                                                        "--:--"}
                                                </td>
                                                <td>
                                                    {formatTime(record.checkOutTime) ||
                                                        "--:--"}
                                                </td>
                                                <td>
                                                    {(record.workedTime ?? 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No attendance records for this date</p>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* ADMIN TABLE */}
            {(role === "ROLE_ADMIN" || role === "ROLE_HR" || role === "ROLE_MANAGER") && (
                <Card className="mt-4">
                    <Card.Header as="h5">Attendance on {date}</Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Status</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Hours Worked</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {attendanceData.map((rec, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <strong>
                                                    {rec.employeeName}
                                                </strong>
                                                <br />
                                                <small>ID: {rec.employeeCode}</small>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${rec.attendanceStatus ===
                                                            "PRESENT"
                                                            ? "success"
                                                            : "danger"
                                                        }`}
                                                >
                                                    {rec.attendanceStatus}
                                                </span>
                                            </td>
                                            <td>{formatTime(rec.checkInTime) || "--:--"}</td>
                                            <td>
                                                {formatTime(rec.checkOutTime) || "--:--"}
                                            </td>
                                            <td>{rec.workedTime || "--"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default Attendance;
