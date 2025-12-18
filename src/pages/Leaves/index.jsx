import { useEffect, useState } from "react";
import { Card, Form, Table, Button, Alert, Collapse } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import { leaveApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

const LeaveApplyForm = ({ refresh }) => {
  const [leaveType, setLeaveType] = useState("SICK");
  const [startDate, setFromDate] = useState("");
  const [endDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dateError, setDateError] = useState(null);


  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDateError(null);

    if (!startDate || !endDate) {
      setError("Select both From and To dates");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setDateError("To date cannot be before From date");
      return;
    }

    const payload = {
      employeeId: user.employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
    };

    try {
      await leaveApi.apply(payload);
      setMsg("Leave applied successfully!");
      refresh();
      setIsOpen(false);
    } catch (e) {
      setError("Failed to apply leave");
    }
  };

  return (
    <Card className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Card.Header>Apply Leave</Card.Header>
        <Button type="button" variant="primary" style={{ marginRight: "20px", marginTop: "10px" }} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Close Form" : "Apply Leave"}
        </Button>
      </div>
      <Card.Body>
        {msg && <Alert variant="success">{msg}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Collapse in={isOpen}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Leave Type</Form.Label>
              <Form.Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="ANNUAL">Annual Leave</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={startDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => {
                setFromDate(e.target.value)
                setToDate("");
                setDateError(null);
              }} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control type="date" min={startDate || new Date().toISOString().split("T")[0]} value={endDate} onChange={(e) => {
                setToDate(e.target.value)
                setDateError(null);
              }
              } isInvalid={!!dateError}
                required />
              <Form.Control.Feedback type="invalid">
                {dateError}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit">Apply</Button>
          </Form>
        </Collapse>
      </Card.Body>
    </Card>
  );
};


const Leaves = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [message, setMessage] = useState(null);
  const { user } = useAuth();
  const employeeId = user?.employeeId;

  // Load leaves
  const loadLeaves = async () => {
    try {
      let res;

      if (user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") {
        res = await leaveApi.getAll();
      } else {
        res = await leaveApi.getByEmployee(employeeId);
      }

      const leavesArray = res?.data?.data ?? [];
      setLeaveData(leavesArray);
    } catch (err) {
      console.error("Error loading leaves:", err);
      setLeaveData([]);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  // Approve or Reject
  const handleAction = async (leaveId, actionType) => {
    const payload = {
      action: actionType,
      comment: `${actionType} by ${user.firstName}`,
      actorEmployeeId: user.employeeId
    };

    try {
      await leaveApi.actOnLeave(leaveId, payload);
      setMessage(`Leave ${actionType.toLowerCase()} successfully`);
      loadLeaves();
    } catch (err) {
      console.error("Action error:", err);
      setMessage("Failed to perform action");
    }
  };


  // Filter by date
  const filteredLeaves = leaveData.filter((l) => {
    if (!dateFilter) return true;
    const filterDate = new Date(dateFilter);
    return filterDate >= new Date(l.startDate) && filterDate <= new Date(l.endDate);
  });

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h2>{(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") ? "Leaves Management" : "My Leaves"}</h2>

        <Form.Group className="d-flex">
          <Form.Label className="me-2">
            <FaCalendarAlt /> Date:
          </Form.Label>
          <Form.Control
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Form.Group>
      </div>

      {(user.role !== "ROLE_ADMIN" && user.role !== "ROLE_HR" && user.role !== "ROLE_MANAGER") && (
        <LeaveApplyForm refresh={loadLeaves} />
      )}
      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mt-4">
        <Card.Header>Leave Records</Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") && <th>Employee</th>}
                  <th>Type</th>
                  <th>Status</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.length ? (
                  filteredLeaves.map((l) => (
                    <tr key={l.id}>
                      {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") && (
                        <td>
                          {l.employeeName}
                          <br />
                          <small>{l.employeeCode}</small>
                        </td>
                      )}

                      <td>{l.leaveType}</td>
                      <td>
                        <span
                          className={`badge bg-${l.status === "APPROVED"
                            ? "success"
                            : l.status === "REJECTED"
                              ? "danger"
                              : "warning"
                            }`}
                        >
                          {l.status}
                        </span>
                      </td>

                      <td>{l.startDate}</td>
                      <td>{l.endDate}</td>
                      <td>{l.days}</td>

                      {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") && (
                        <td>
                          {l.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                className="me-2"
                                onClick={() => handleAction(l.id, "APPROVE")}
                              >
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleAction(l.id, "REJECT")}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="leave-mobile-list">
            {filteredLeaves.map((l) => (
              <div className="leave-card" key={l.id}>

                {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") && (
                  <div className="field">
                    <div className="label">Employee</div>
                    <div className="value">{l.employeeName} ({l.employeeCode})</div>
                  </div>
                )}

                <div className="field">
                  <div className="label">Leave Type</div>
                  <div className="value">{l.leaveType}</div>
                </div>

                <div className="field">
                  <div className="label">Status</div>
                  <span className={`badge bg-${l.status === "APPROVED" ? "success" :
                    l.status === "REJECTED" ? "danger" : "warning"
                    }`}>
                    {l.status}
                  </span>
                </div>

                <div className="field">
                  <div className="label">From</div>
                  <div className="value">{l.startDate}</div>
                </div>

                <div className="field">
                  <div className="label">To</div>
                  <div className="value">{l.endDate}</div>
                </div>

                <div className="field">
                  <div className="label">Days</div>
                  <div className="value">{l.days}</div>
                </div>

                {(user.role === "ROLE_ADMIN" || user.role === "ROLE_MANAGER" || user.role === "ROLE_HR") &&
                  l.status === "PENDING" && (
                    <div className="d-flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleAction(l.id, "APPROVE")}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction(l.id, "REJECT")}>Reject</Button>
                    </div>
                  )}
              </div>
            ))}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default Leaves;
