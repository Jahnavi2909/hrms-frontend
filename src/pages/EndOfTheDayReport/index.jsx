import { useState, useEffect } from "react";
import { Card, Form, Table, Button, Alert, Collapse } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import { eodApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

// EOD FORM

const EODForm = ({ onAdd, user }) => {
  const [workSummary, setWorkSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workSummary) {
      setError("Work summary is required.");
      return;
    }

    try {
      const res = await eodApi.create({
        employeeId: user.employeeId,
        employeeCode: user.employee.employeeId,
        workSummary,
        blockers,
        date: new Date().toISOString().split("T")[0],
        status: "SUBMITTED",
      });

      const newEOD = res.data.data;
      onAdd(newEOD);

      setWorkSummary("");
      setBlockers("");
      setMessage("EOD submitted successfully!");
      setError(null);
      setIsOpen(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to submit EOD.");
    }
  };

  return (
    <Card className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Card.Header as="h5">Submit EOD Report</Card.Header>
        <Button type="button" variant="primary" style={{ marginRight: "20px", marginTop: "10px" }} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Close Form" : "Fill EOD Report"}
        </Button>
      </div>
      <Card.Body>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Collapse in={isOpen}>
          <Form onSubmit={handleSubmit} className="eod-form">
            <Form.Group className="mb-3">
              <Form.Label>Work Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Blockers / Issues (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Submit EOD
            </Button>
          </Form>
        </Collapse>
      </Card.Body>
    </Card>
  );
};


// MAIN EOD COMPONENT

const EndOfTheDayReport = () => {
  const [eods, setEODs] = useState([]);
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [message, setMessage] = useState(null);


  const role = user.role;

  // FETCH EODS

  const fetchEODs = async () => {
    try {
      const res =
        role === "ROLE_EMPLOYEE"
          ? await eodApi.getByEmployee(user.employeeId)
          : await eodApi.getAll();

      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      console.log("Final parsed EODs:", list);
      setEODs(list);
    } catch (err) {
      console.error("EOD fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchEODs();
  }, []);

  // ADD EOD
  const handleAddEOD = (newEOD) => {
    setEODs((prev) => [newEOD, ...prev]);
  };

  // UPDATE STATUS
  const handleStatusChange = async (eodId, status) => {
    try {
      await eodApi.update(eodId, { status });

      setEODs((prev) =>
        prev.map((e) => (e.id === eodId ? { ...e, status } : e))
      );

      setMessage(`EOD marked as ${status.toLowerCase()}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update EOD status.");
    }
  };

  // DATE FILTER
  const filteredEODs = eods.filter((e) => {
    if (!dateFilter) return true;
    return e.date === dateFilter;
  });

  return (
    <div className="eod-container">
      <div className="d-flex justify-content-between align-items-center mb-4 eod-header">
        <h1>
          {role === "ROLE_ADMIN" || role === "ROLE_MANAGER" ? "EOD Reports Management" : "My EOD Reports"}
        </h1>

        <Form.Group className="d-flex align-items-center eod-date-filter">
          <Form.Label className="me-2 mb-0">
            <FaCalendarAlt className="me-1" /> Date:
          </Form.Label>
          <Form.Control
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: "auto" }}
          />
        </Form.Group>
      </div>

      {(role !== "ROLE_ADMIN" && role !== "ROLE_MANAGER") && (
        <EODForm onAdd={handleAddEOD} user={user} />
      )}

      {message && (
        <Alert variant="success" className="mt-3">
          {message}
        </Alert>
      )}

      <Card className="mt-4">
        <Card.Header as="h5">
          {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") ? "All EOD Reports" : "My EOD Reports"}
        </Card.Header>

        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && <th>Employee</th>}
                  <th>Date</th>
                  <th>Work Summary</th>
                  <th>Blockers</th>
                  <th>Status</th>
                  {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredEODs.length > 0 ? (
                  filteredEODs.map((e) => (
                    <tr key={e.id}>
                      {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && (
                        <td>
                          <strong>{e.employeeName}</strong>
                          <br />
                          <small>ID: {e.employeeCode}</small>
                        </td>
                      )}

                      <td>{e.date}</td>
                      <td>{e.workSummary}</td>
                      <td>{e.blockers || "--"}</td>

                      <td>
                        <span
                          className={`badge bg-${e.status === "APPROVED"
                            ? "success"
                            : e.status === "REJECTED"
                              ? "danger"
                              : "primary"
                            }`}
                        >
                          {e.status}
                        </span>
                      </td>

                      {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") &&
                        e.status === "SUBMITTED" && (
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() =>
                                handleStatusChange(e.id, "APPROVED")
                              }
                            >
                              Approve
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(e.id, "REJECTED")
                              }
                            >
                              Reject
                            </Button>
                          </td>
                        )}

                      {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") &&
                        e.status !== "SUBMITTED" && <td></td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") ? 6 : 5}
                      className="text-center empty-row"
                    >
                      No EOD reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="eod-mobile-list">
            {filteredEODs.map((e) => (
              <div className="eod-card" key={e.id}>
                {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && (
                  <div className="field">
                    <div className="label">Employee</div>
                    <div className="value">{e.employeeName} ({e.employeeCode})</div>
                  </div>
                )}

                <div className="field">
                  <div className="label">Date</div>
                  <div className="value">{e.date}</div>
                </div>

                <div className="field">
                  <div className="label">Work Summary</div>
                  <div className="value">{e.workSummary}</div>
                </div>

                <div className="field">
                  <div className="label">Blockers</div>
                  <div className="value">{e.blockers || "--"}</div>
                </div>

                <div className="field">
                  <div className="label">Status</div>
                  <span className={`badge bg-${e.status === "APPROVED" ? "success" :
                      e.status === "REJECTED" ? "danger" : "primary"
                    }`}>
                    {e.status}
                  </span>
                </div>

                {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && e.status === "SUBMITTED" && (
                  <div className="field">
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2 mb-2"
                      onClick={() => handleStatusChange(e.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusChange(e.id, "REJECTED")}
                    >
                      Reject
                    </Button>
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

export default EndOfTheDayReport;
