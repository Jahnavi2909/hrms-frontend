import { useEffect, useState } from "react";
import { Card, Col, ProgressBar, Row } from "react-bootstrap";

import { attendanceApi, employeeApi } from "../../services/api";
import { useParams } from "react-router-dom";
import EmployeeProfileInfo from "../../contexts/layout/EmployeeProfileInfo";

const SHIFT_HOURS = 8;

/* ---------- Helpers ---------- */

const formatTime = (iso) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatHoursWorked = (time) => {
    if (!time) return "00 hrs 00 min";
    const [h, m] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")} hrs ${String(m).padStart(2, "0")} min`;
};

/* ---------- Timeline ---------- */

const Timeline = ({ record, liveWorked }) => {
    const worked = record.checkOutTime
        ? record.workedTime
        : liveWorked[record.id];

    const hoursWorked = worked ? parseInt(worked.split(":")[0]) : 0;
    const percent = Math.min((hoursWorked / SHIFT_HOURS) * 100, 100);

    return (
        <div className="mt-1">
            <small className="text-muted">
                {formatTime(record.checkInTime)} →{" "}
                {record.checkOutTime ? formatTime(record.checkOutTime) : "Now"}
            </small>
            <ProgressBar
                now={percent}
                variant={percent < 50 ? "danger" : "success"}
            />
        </div>
    );
};

/* ---------- Main Component ---------- */

const AttendanceHistory = ({ employeeId }) => {
    const { id } = useParams();
    const [attendance, setAttendance] = useState([]);
    const [liveWorked, setLiveWorked] = useState({});
    const [error, setError] = useState("");

    const empId = id || employeeId;

    /* ---- Fetch Employee + Attendance ---- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const attRes = await attendanceApi.getAttendanceHistory(empId);
                setAttendance(attRes.data.data || []);
            } catch {
                setError("Failed to load data");
            }
        };

        if (empId) fetchData();
    }, [empId]);

    /* ---- Live Timer ---- */
    useEffect(() => {
        const timer = setInterval(() => {
            const updated = {};
            attendance.forEach((r) => {
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

    return (
        <div>
            {error && <p className="text-danger">{error}</p>}

            <EmployeeProfileInfo empId={empId} />

            <Card>
                <Card.Header>Attendance History</Card.Header>
                <Card.Body>

                    {/* ================= DESKTOP TABLE ================= */}
                    <div className="table-responsive d-none d-md-block">
                        {attendance.length ? (
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
                                    {attendance.map((record) => (
                                        <tr key={record.id}>
                                            <td>{new Date(record.date).toLocaleDateString()}</td>
                                            <td>
                                                <span
                                                    className={`badge bg-${record.attendanceStatus === "PRESENT"
                                                            ? "success"
                                                            : "danger"
                                                        }`}
                                                >
                                                    {record.attendanceStatus}
                                                </span>
                                            </td>
                                            <td>{formatTime(record.checkInTime)}</td>
                                            <td>{formatTime(record.checkOutTime)}</td>
                                            <td>
                                                {record.checkOutTime
                                                    ? formatHoursWorked(record.workedTime)
                                                    : formatHoursWorked(liveWorked[record.id])}
                                                <Timeline record={record} liveWorked={liveWorked} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No attendance records found</p>
                        )}
                    </div>

                    {/* ================= MOBILE CARDS ================= */}
                    <div className="d-block d-md-none">
                        {attendance.length === 0 && (
                            <p className="text-center text-muted">No attendance records found</p>
                        )}

                        {attendance.map((record) => (
                            <Card key={record.id} className="mb-3 shadow-sm">
                                <Card.Body>

                                    <div className="mb-2">
                                        <strong>Date:</strong>{" "}
                                        {new Date(record.date).toLocaleDateString()}
                                    </div>

                                    <div className="mb-2">
                                        <strong>Status:</strong>{" "}
                                        <span
                                            className={`badge bg-${record.attendanceStatus === "PRESENT"
                                                    ? "success"
                                                    : "danger"
                                                }`}
                                        >
                                            {record.attendanceStatus}
                                        </span>
                                    </div>

                                    <div className="mb-2">
                                        <strong>Check In:</strong> {formatTime(record.checkInTime)}
                                    </div>

                                    <div className="mb-2">
                                        <strong>Check Out:</strong> {formatTime(record.checkOutTime)}
                                    </div>

                                    <div className="mb-2">
                                        <strong>Hours Worked:</strong>{" "}
                                        {record.checkOutTime
                                            ? formatHoursWorked(record.workedTime)
                                            : formatHoursWorked(liveWorked[record.id])}
                                    </div>

                                    <Timeline record={record} liveWorked={liveWorked} />

                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                </Card.Body>

            </Card>
        </div>
    );
};

export default AttendanceHistory;
