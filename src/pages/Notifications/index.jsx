import { useState } from "react";
import { Card, Table, Button, Badge, Alert, Placeholder } from "react-bootstrap";
import { FaCircle, FaTrash } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

const Notifications = () => {
  const { user, notifications, markAsRead, deleteNotification } = useAuth();

  const [filterType, setFilterType] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "ALL" && n.type !== filterType) return false;
    if (filterDate && n.date !== filterDate) return false;
    return true;
  });

  const SkeletonRow = () => (
    <tr>
      <td colSpan="7">
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} />
        </Placeholder>
      </td>
    </tr>
  );

  return (
    <div>
      <h1 className="mb-4">Notifications</h1>
      {msg && <Alert variant="danger">{msg}</Alert>}

      <Card>
        <Card.Header as="h5">Notifications</Card.Header>
        <Card.Body>
          {/* DESKTOP TABLE */}
          <div className="table-responsive d-none d-md-block">
            <Table hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Sender</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : filteredNotifications.length ? (
                  filteredNotifications.map((n) => (
                    <tr key={n.id} className={!n.read ? "fw-bold" : ""}>
                      <td>
                        <FaCircle
                          size={10}
                          className={n.read ? "text-muted" : "text-primary"}
                        />
                      </td>
                      <td>
                        <Badge bg="secondary">{n.type}</Badge>
                      </td>
                      <td>{n.title}</td>
                      <td>{n.message}</td>
                      <td>{n.senderName || "System"}</td>
                      <td>{n.date}</td>
                      <td className="d-flex gap-2">
                        <Button size="sm" onClick={() => markAsRead(n.id)} variant={n.read ? "secondary" : "primary"}>
                          Mark Read
                        </Button>
                        {(user.role === "ROLE_ADMIN" || user.role === "ROLE_HR") && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteNotification(n.id)}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No notifications
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* MOBILE */}
          <div className="d-block d-md-none">
            {loading ? (
              <Placeholder animation="glow">
                <Placeholder xs={12} />
                <Placeholder xs={10} />
              </Placeholder>
            ) : (
              filteredNotifications.map((n) => (
                <div key={n.id} className="notification-card p-3 mb-3 border rounded">
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{n.senderName || "System"}</small>
                </div>
              ))
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Notifications;
