import { useState, useEffect, useRef } from "react";
import { Card, Table, Button, Badge, Form, Alert } from "react-bootstrap";
import { FaCircle, FaTrash } from "react-icons/fa";
import { notificationApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./style.css";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [msg, setMsg] = useState(null);

  const stompClientRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAllNotifications();
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setMsg("Failed to load notifications");
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    const socket = new SockJS("https://d1ujpx8cjlbvx.cloudfront.net/ws");
    const stomp = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    stomp.onConnect = () => {
      const userQueue = `/queue/notifications/${user?.id}`;
      stomp.subscribe(userQueue, (payload) => {
        const newNotification = JSON.parse(payload.body);
        setNotifications((prev) => [newNotification, ...prev]);
      });
    };

    stomp.onStompError = (err) => console.error("STOMP error:", err);
    stomp.activate();
    stompClientRef.current = stomp;
  };

  useEffect(() => {
    loadNotifications();
    connectWebSocket();
    return () => {
      stompClientRef.current?.deactivate();
    };
  }, []);

 
  const handleToggleRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
      setMsg("Failed to mark notification as read");
    }
  };


  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
      setMsg("Failed to delete notification");
    }
  };


  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "ALL" && n.type !== filterType) return false;
    if (filterDate && n.date !== filterDate) return false;
    return true;
  });

  return (
    <div>
      <h1 className="mb-4">Notifications</h1>
      <Card className="mb-4">
        <Card.Header as="h5">Filters</Card.Header>
        <Card.Body className="d-flex gap-3 flex-wrap">
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ALERT">Alert</option>
              <option value="TASK">Task</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="secondary"
            onClick={() => {
              setFilterType("ALL");
              setFilterDate("");
            }}
          >
            Reset
          </Button>
        </Card.Body>
      </Card>

      {msg && <Alert variant="danger">{msg}</Alert>}

      <Card>
        <Card.Header as="h5">Notifications List</Card.Header>
        <Card.Body>
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <Table hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <tr key={n.id} className={!n.read ? "fw-bold" : ""}>
                      <td>
                        <FaCircle
                          size={10}
                          className={n.read ? "text-muted" : "text-primary"}
                        />
                      </td>
                      <td>
                        <Badge
                          bg={
                            n.type === "INFO"
                              ? "info"
                              : n.type === "WARNING"
                                ? "warning"
                                : n.type === "ALERT"
                                  ? "danger"
                                  : "secondary"
                          }
                        >
                          {n.type}
                        </Badge>
                      </td>
                      <td>{n.title}</td>
                      <td>{n.message}</td>
                      <td>{n.date}</td>
                      <td className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant={n.read ? "secondary" : "primary"}
                          onClick={() => handleToggleRead(n.id)}
                        >
                          Mark Read
                        </Button>
                        {(user.role === "ROLE_ADMIN" || user.role === "ROLE_HR") && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(n.id)}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Mobile Card/List View */}
          <div className="d-block d-md-none">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div className="notification-card mb-3 p-3 border rounded" key={n.id}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>
                      <FaCircle
                        size={10}
                        className={n.read ? "text-muted" : "text-primary"}
                      />{" "}
                      <Badge
                        bg={
                          n.type === "INFO"
                            ? "info"
                            : n.type === "WARNING"
                              ? "warning"
                              : n.type === "ALERT"
                                ? "danger"
                                : "secondary"
                        }
                      >
                        {n.type}
                      </Badge>
                    </span>
                    <span>{n.date}</span>
                  </div>
                  <div className="mb-2">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant={n.read ? "secondary" : "primary"}
                      onClick={() => handleToggleRead(n.id)}
                    >
                      Mark Read
                    </Button>
                    {(user.role === "ROLE_ADMIN" || user.role === "ROLE_HR") && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(n.id)}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No notifications found</p>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Notifications;
