import { useEffect, useState } from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { taskApi } from "../../services/api";
import EmployeeProfileInfo from "../../contexts/layout/EmployeeProfileInfo";

/* ---------- Helpers ---------- */

const formatDate = (date) => {
  if (!date) return "--";
  return new Date(date).toLocaleDateString();
};

const statusVariant = (status) => {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
      return "primary";
    default:
      return "warning";
  }
};

const priorityVariant = (priority) => {
  switch (priority) {
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    default:
      return "secondary";
  }
};

/* ---------- Main Component ---------- */

const TaskHistory = ({ employeeId }) => {
  const { id } = useParams();
  const empId = id || employeeId;

  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  /* ---- Fetch Tasks ---- */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await taskApi.getByEmployee(empId);
        setTasks(res.data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load task history");
      }
    };

    if (empId) fetchTasks();
  }, [empId]);

  return (
    <div>
      {error && <p className="text-danger">{error}</p>}

      <EmployeeProfileInfo empId={empId} />

      <Card className="mt-3">
        <Card.Header>Task History</Card.Header>
        <Card.Body>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="table-responsive d-none d-md-block">
            {tasks.length ? (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Start Date</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <br />
                        <small className="text-muted">{task.description}</small>
                      </td>
                      <td>
                        <Badge bg={statusVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={priorityVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td>{formatDate(task.startDate)}</td>
                      <td>{formatDate(task.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No tasks found</p>
            )}
          </div>

          {/* ================= MOBILE CARDS ================= */}
          <div className="d-block d-md-none">
            {tasks.length === 0 && (
              <p className="text-center text-muted">No tasks found</p>
            )}

            {tasks.map((task) => (
              <Card key={task.id} className="mb-3 shadow-sm">
                <Card.Body>

                  <div className="mb-2">
                    <strong>Title:</strong> {task.title}
                  </div>

                  {task.description && (
                    <div className="mb-2">
                      <strong>Description:</strong> {task.description}
                    </div>
                  )}

                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    <Badge bg={statusVariant(task.status)}>
                      {task.status}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <strong>Priority:</strong>{" "}
                    <Badge bg={priorityVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <strong>Start Date:</strong> {formatDate(task.startDate)}
                  </div>

                  <div className="mb-2">
                    <strong>Due Date:</strong> {formatDate(task.dueDate)}
                  </div>

                </Card.Body>
              </Card>
            ))}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskHistory;
