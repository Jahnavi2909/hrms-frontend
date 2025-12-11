import { useState, useEffect } from "react";
import { Card, Form, Table, Button, Alert, Badge, Collapse } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { taskApi, employeeApi } from "../../services/api";
import "./style.css";

const TaskCreateForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [employee, setEmployee] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const [employeesList, setEmployeesList] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.getAllEmployee();
      if (res.data?.data) setEmployeesList(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch employees.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !employee || !dueDate) {
      setError("Title, Due Date, and Employee are required.");
      return;
    }

    try {
      const requestBody = {
        title,
        description,
        assignedToEmployeeId: employee,
        priority,
        dueDate,
      };

      const res = await taskApi.create(requestBody);

      if (res.data?.data) {
        onAdd(res.data.data);
        setMessage("Task created successfully!");
        setTitle("");
        setDescription("");
        setEmployee("");
        setPriority("MEDIUM");
        setDueDate("");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create task.");
    }
  };

  return (
    <Card className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Card.Header as="h5">Create New Task</Card.Header>
        <Button type="submit" variant="primary" style={{ marginRight: "20px", marginTop: "10px" }} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Close Form" : "Create Task"}
        </Button>
      </div>
      <Card.Body>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Collapse in={isOpen}>
          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.id})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit" variant="primary" onClick={() => setIsOpen(!isOpen)}>
              Create Task
            </Button>
          </Form>
        </Collapse>


      </Card.Body>
    </Card>
  );
};

const Tasks = () => {
  const { user } = useAuth();
  const role = user.role;

  const [tasks, setTasks] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      let res;
      if (role === "ROLE_EMPLOYEE") {
        res = await taskApi.getByEmployee(user.employeeId);
      } else {
        res = await taskApi.getAll();
      }
      if (res.data?.data) setTasks(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = (task) => {
    setTasks([task, ...tasks]);
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, { status });
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
      setTasks(updated);
      setMessage(`Task marked as ${status}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const start = new Date(t.startDate);
    const end = new Date(t.dueDate);
    const filter = new Date(dateFilter);
    return filter >= start && filter <= end;
  });

  const visibleTasks = role === "ROLE_EMPLOYEE"
    ? filteredTasks.filter((t) => t.assignedToEmployeeId === user.employeeId)
    : filteredTasks;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{role === "ROLE_EMPLOYEE" ? "My Tasks" : "Task Management"}</h1>

        <Form.Group className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0">
            <FaCalendarAlt className="me-1" /> Date:
          </Form.Label>
          <Form.Control
            type="date"
            style={{ width: "auto" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Form.Group>
      </div>

      {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && (
        <TaskCreateForm onAdd={handleAddTask} />
      )}

      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mt-4">
        <Card.Header as="h5">{role === "ROLE_EMPLOYEE" ? "Assigned Tasks" : "All Tasks"}</Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && <th>Employee</th>}
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Start</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.length > 0 ? visibleTasks.map((t) => (
                  <tr key={t.id}>
                    {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER" || "ROLE_HR") && (
                      <td>
                        <strong>{t.assignedToEmployeeName}</strong><br />
                        <small>ID: {t.employeeCode}</small>
                      </td>
                    )}
                    <td>{t.title}</td>
                    <td>
                      <Badge
                        bg={t.status === "COMPLETED" ? "success" :
                          t.status === "IN_PROGRESS" ? "primary" : "warning"}
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td>{t.priority}</td>
                    <td>{t.startDate}</td>
                    <td>{t.dueDate}</td>
                    <td>
                      {role === "ROLE_EMPLOYEE" && t.assignedToEmployeeId === user.employeeId && t.status !== "COMPLETED" && (
                        <Button size="sm" variant="success" onClick={() => handleStatusChange(t.id, "COMPLETED")}>
                          Mark Complete
                        </Button>
                      )}
                      {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && t.status !== "COMPLETED" && (
                        <Button size="sm" variant="success" onClick={() => handleStatusChange(t.id, "COMPLETED")}>
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") ? 7 : 6} className="text-center">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="task-mobile-list">
            {visibleTasks.map((t) => (
              <div className="task-card" key={t.id}>
                {(role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && (
                  <div className="field">
                    <div className="label">Employee</div>
                    <div className="value">{t.assignedToEmployeeName} ({t.employeeCode})</div>
                  </div>
                )}

                <div className="field">
                  <div className="label">Title</div>
                  <div className="value">{t.title}</div>
                </div>

                <div className="field">
                  <div className="label">Status</div>
                  <span className={`badge bg-${t.status === "COMPLETED" ? "success" :
                      t.status === "IN_PROGRESS" ? "primary" : "warning"
                    }`}>
                    {t.status}
                  </span>
                </div>

                <div className="field">
                  <div className="label">Priority</div>
                  <div className="value">{t.priority}</div>
                </div>

                <div className="field">
                  <div className="label">Start</div>
                  <div className="value">{t.startDate}</div>
                </div>

                <div className="field">
                  <div className="label">Due</div>
                  <div className="value">{t.dueDate}</div>
                </div>

                <div className="field">
                  {(role === "ROLE_EMPLOYEE" && t.assignedToEmployeeId === user.employeeId && t.status !== "COMPLETED") ||
                    (role === "ROLE_ADMIN" || role === "ROLE_MANAGER") && t.status !== "COMPLETED" ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusChange(t.id, "COMPLETED")}
                    >
                      Mark Complete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default Tasks;