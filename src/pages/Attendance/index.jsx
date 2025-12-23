import { memo, useEffect, useState } from "react";
import { Card, Form, Table, Badge, ProgressBar } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import { attendanceApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./style.css";
import useAutoCheckout from "../../contexts/layout/AutoCheckout";

const OFFICE_START_HOUR = 10;
const OFFICE_START_MIN = 0;
const SHIFT_HOURS = 8;
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_START = 9 * 60;
const SHIFT_END = 18 * 60;

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user.role;
  const employeeId = user.employeeId;
  const isAdmin = ["ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER"].includes(role);

  const [attendanceData, setAttendanceData] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [forceReload, setForceReload] = useState(false);
  const [liveWorked, setLiveWorked] = useState({});
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [weeklyTimelineData, setWeeklyTimelineData] = useState([]);
  const [weeklySummaryData, setWeeklySummaryData] = useState(null);

  useAutoCheckout();

  /* ---------------- HELPERS ---------------- */
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    if (day !== 1) d.setDate(d.getDate() - (day - 1));
    return d.toISOString().split("T")[0];
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const isSameDay = (d1, d2) =>
    new Date(d1).toISOString().split("T")[0] === d2;

  const isFutureDay = (date) =>
    new Date(date) > new Date(todayStr);

  const getWeekDayIndex = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
  };


  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  const formatHoursWorked = (time) => {
    if (!time) return "00 hrs 00 min";
    const [h, m] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")} hrs ${String(m).padStart(2, "0")} min`;
  };

  const isLate = (checkIn) => {
    if (!checkIn) return false;
    const d = new Date(checkIn);
    return (
      d.getHours() > OFFICE_START_HOUR ||
      (d.getHours() === OFFICE_START_HOUR && d.getMinutes() > OFFICE_START_MIN)
    );
  };

  const timeToPercent = (time) => {
    if (!time) return 0;
    const d = new Date(time);
    const mins = d.getHours() * 60 + d.getMinutes();
    return ((mins - SHIFT_START) / (SHIFT_END - SHIFT_START)) * 100;
  };

  const groupByEmployee = (records) => {
    const map = {};

    records.forEach((r) => {
      if (!map[r.employeeId]) {
        map[r.employeeId] = {
          employeeId: r.employeeId,
          name: "Unknown",
          code: r.employeeCode ?? null,
          days: {},
        };
      }

      if (r.firstName || r.lastName) {
        map[r.employeeId].name =
          [r.firstName, r.lastName].filter(Boolean).join(" ");
      }

      if (r.employeeCode) {
        map[r.employeeId].code = r.employeeCode;
      }

      map[r.employeeId].days[getWeekDayIndex(r.date)] = r;
    });

    return Object.values(map);
  };


  /* ---------------- LOAD DATA ---------------- */
  const loadAttendance = async () => {
    try {
      let res;
      if (!isAdmin) {
        res = await attendanceApi.getAttendanceHistory(employeeId);
        const data = res.data.data || [];
        setAttendanceData(data.filter((r) => r.date.split("T")[0] === date));
        return;
      }
      res = await attendanceApi.getAttendanceByDate(date);
      setAttendanceData(
        (res.data.data || []).map((r) => ({ ...r, employeeName: `${r.firstName} ${r.lastName}` }))
      );
    } catch (e) {
      console.error("Attendance load failed", e);
    }
  };

  const loadWeeklyTimeline = async () => {
    try {
      let res;
      if (!isAdmin) {
        res = await attendanceApi.getWeeklyTimeline(employeeId, weekStart);
      } else {

        res = await attendanceApi.getWeeklyTimeline(undefined, weekStart);
      }
      setWeeklyTimelineData(res.data.data.records || []);
      setWeeklySummaryData(res.data.data.summary || null);
    } catch (e) {
      console.error("Weekly timeline load failed", e);
    }
  };


  useEffect(() => {
    loadAttendance();
  }, [date, forceReload]);

  useEffect(() => {
    loadWeeklyTimeline();
  }, [weekStart]);

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = {};
      attendanceData.forEach((r) => {
        if (r.checkInTime && !r.checkOutTime) {
          const start = new Date(r.checkInTime);
          const now = new Date();
          const mins = Math.floor((now - start) / 60000);
          updated[r.id] = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
        }
      });
      setLiveWorked(updated);
    }, 1000);
    return () => clearInterval(timer);
  }, [attendanceData]);

  useEffect(() => {
    const h = () => setForceReload((p) => !p);
    window.addEventListener("attendance-updated", h);
    return () => window.removeEventListener("attendance-updated", h);
  }, []);

  /* ---------------- COMPONENTS ---------------- */
  const TimelineBar = ({ rec }) => {
    const worked = rec.checkOutTime ? rec.workedTime : liveWorked[rec.id] || "00:00";
    const [hours, minutes] = worked.split(":").map(Number);
    const percent = Math.min((hours + minutes / 60) / SHIFT_HOURS * 100, 100);

    return (
      <div className="mt-1">
        <small className="text-muted">
          {formatTime(rec.checkInTime)} → {rec.checkOutTime ? formatTime(rec.checkOutTime) : "Now"}
        </small>
        <ProgressBar now={percent} variant={percent < 50 ? "danger" : "success"} />
      </div>
    );
  };

  const TimelineDots = ({ rec }) => (
    <div className="timeline-bar position-relative my-1">
      {rec.checkInTime && <span className="dot checkin" style={{ left: `${timeToPercent(rec.checkInTime)}%` }} />}
      {rec.checkOutTime && <span className="dot checkout" style={{ left: `${timeToPercent(rec.checkOutTime)}%` }} />}
    </div>
  );

  const getWorkedMinutes = (rec) => {
    if (!rec?.checkInTime) return 0;

    const start = new Date(rec.checkInTime);
    const end = rec.checkOutTime ? new Date(rec.checkOutTime) : new Date();

    return Math.floor((end - start) / 60000);
  };

  const isToday = (rec) =>
    rec && isSameDay(rec.date, todayStr);

  const hasCompletedShift = (rec) =>
    getWorkedMinutes(rec) >= SHIFT_HOURS * 60;

  const isOnlineNow = (rec) =>
    isToday(rec) &&
    rec?.checkInTime &&
    !hasCompletedShift(rec);

  const isPresentToday = (rec) =>
    isToday(rec) &&
    rec?.checkInTime &&
    hasCompletedShift(rec);


  const DayRecord = ({ rec }) => {
    // Future day
    if (rec && isFutureDay(rec.date)) {
      return <Badge bg="secondary">Upcoming</Badge>;
    }

    // Today but no check-in
    if (!rec && !isFutureDay(todayStr)) {
      return <Badge bg="danger">Leave</Badge>;
    }

    if (!rec) {
      return <Badge bg="danger">Leave</Badge>;
    }

    const workedTime = rec.checkOutTime
      ? rec.workedTime
      : liveWorked[rec.id];

    return (
      <>
        <TimelineDots rec={rec} />

        <small>
          {workedTime
            ? formatHoursWorked(workedTime)
            : "00 hrs 00 min"}
        </small>

        <div>
          {/* Late badge */}
          {isLate(rec.checkInTime) && (
            <Badge bg="warning" className="me-1">Late</Badge>
          )}

          {/* TODAY LOGIC */}
          {isOnlineNow(rec) && (
            <Badge bg="info" className="me-1">Online</Badge>
          )}

          {isPresentToday(rec) && (
            <Badge bg="success" className="me-1">Present</Badge>
          )}

          {/* Past day default */}
          {!isToday(rec) && !rec?.checkInTime && (
            <Badge bg="danger">Leave</Badge>
          )}
        </div>
      </>
    );
  };



  const WeeklyTimelineHorizontalTable = ({ data }) => {
    const employees = groupByEmployee(data);
    return (
      <div className="table-responsive d-none d-md-block">
        <Table bordered hover className="weekly-horizontal-table">
          <thead>
            <tr>
              <th>Employee</th>
              {WEEK_DAYS.map((day) => <th key={day} className="text-center">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.employeeId}>
                <td>
                  <strong>{emp.name}</strong><br />
                  <small className="text-muted">{emp.code}</small>
                </td>
                {WEEK_DAYS.map((_, dayIdx) =>
                  <td key={dayIdx}>
                    <DayRecord rec={emp.days[dayIdx]} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const WeeklyTimelineHorizontalCards = ({ data }) => {
    const employees = groupByEmployee(data);
    return (
      <div className="d-block d-md-none">
        {employees.map((emp) => (
          <Card key={emp.employeeId} className="mb-3">
            <Card.Body>
              <h6>{emp.name} <small className="text-muted ms-2">({emp.code})</small></h6>
              {WEEK_DAYS.map((day, dayIdx) => (
                <div key={dayIdx} className="mb-3">
                  <strong>{day}</strong>
                  <DayRecord rec={emp.days[dayIdx]} />
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  const WeeklyTimeline = ({ data = [] }) => (
    !data.length ? <div className="text-center text-muted">No weekly attendance data</div> :
      <>
        <WeeklyTimelineHorizontalTable data={data} />
        <WeeklyTimelineHorizontalCards data={data} />
      </>
  );


  const MobileAttendanceCards = ({ data }) => {
    if (!data.length) {
      return <div className="text-center text-muted">No records found</div>;
    }

    return (
      <div className="attendance-mobile-list d-md-none">
        {data.map((r, i) => (
          <Card key={i} className="mobile-card mb-3 shadow-sm">
            <Card.Body>
              {r.employeeName && (
                <div className="mb-2">
                  <strong>{r.employeeName}</strong>
                  <div className="text-muted small">{r.employeeCode}</div>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>{new Date(r.date).toDateString()}</strong>
                <Badge bg={r.attendanceStatus === "PRESENT" ? "success" : "danger"}>
                  {r.attendanceStatus}
                </Badge>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <div>
                  <small className="text-muted">Check In</small>
                  <div>
                    {formatTime(r.checkInTime)}
                    {isLate(r.checkInTime) && (
                      <Badge bg="warning" className="ms-1">Late</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <small className="text-muted">Check Out</small>
                  <div>{formatTime(r.checkOutTime)}</div>
                </div>
              </div>

              <div className="mb-2">
                <small className="text-muted">Worked Hours</small>
                <div>
                  {r.checkOutTime
                    ? formatHoursWorked(r.workedTime)
                    : formatHoursWorked(liveWorked[r.id])}
                </div>
                <TimelineBar rec={r} />
              </div>

              {/* Online badge */}
              {!r.checkOutTime && r.checkInTime && (
                <Badge bg="info">Online</Badge>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };


  /* ---------------- UI ---------------- */
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{isAdmin ? "All Employees Attendance" : "My Attendance"}</h2>
        <Form.Group className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0"><FaCalendarAlt /> Date</Form.Label>
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Form.Group>
      </div>

      {/* Attendance Table */}
      <Card className="attendance-table d-none d-md-block">
        <Card.Header>Attendance on {date}</Card.Header>
        <Card.Body>
          <Table hover>
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center text-muted">No records found</td></tr>
              ) : attendanceData.map((r, i) => (
                <tr key={i} onClick={() => navigate(`/employee/${r.employeeId}/monthly-attendance`)}>
                  {isAdmin && (
                    <td>
                      <strong>{r.employeeName}</strong><br />
                      <small>{r.employeeCode}</small>
                      {!r.checkOutTime && <Badge bg="success" className="ms-2">Online</Badge>}
                    </td>
                  )}
                  <td><Badge bg={r.attendanceStatus === "PRESENT" ? "success" : "danger"}>{r.attendanceStatus}</Badge></td>
                  <td>{formatTime(r.checkInTime)}{isLate(r.checkInTime) && <Badge bg="warning" className="ms-2">Late</Badge>}</td>
                  <td>{formatTime(r.checkOutTime)}</td>
                  <td>
                    {r.checkOutTime ? formatHoursWorked(r.workedTime) : formatHoursWorked(liveWorked[r.id])}
                    <TimelineBar rec={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <MobileAttendanceCards data={attendanceData} />

      {/* Weekly Timeline */}
      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
        <button className="btn btn-outline-secondary" onClick={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; })}>← Previous Week</button>
        <strong>Week Starting: {weekStart}</strong>
        <button className="btn btn-outline-secondary" onClick={() => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })}>Next Week →</button>
      </div>
      <Card className="mt-3 p-3"><h5>Weekly Timeline</h5><WeeklyTimeline data={weeklyTimelineData} /></Card>

      {/* Weekly Summary */}
      {isAdmin && weeklySummaryData && (
        <Card className="mt-3 p-3">
          <h5>Weekly Summary</h5>
          <div className="d-flex justify-content-between flex-wrap mb-3">
            <div>Payable Days: {weeklySummaryData.payable}</div>
            <div>Present: {weeklySummaryData.present}</div>
            <div>Leave: {weeklySummaryData.leave}</div>
            <div>Weekend: {weeklySummaryData.weekend}</div>
          </div>
          {
            isAdmin && weeklySummaryData &&
            <WeeklyAttendanceChart summary={weeklySummaryData} />
          }

        </Card>
      )}
    </div>
  );
};


/* ---------------- WEEKLY CHART ---------------- */
const WeeklyAttendanceChart = memo(({ summary }) => {
  const data = [
    { name: "Present", value: summary.present },
    { name: "Leave", value: summary.leave },
    { name: "Weekend", value: summary.weekend },
    { name: "Payable", value: summary.payable },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#0d6efd" />
      </BarChart>
    </ResponsiveContainer>
  )
});


export default Attendance;



