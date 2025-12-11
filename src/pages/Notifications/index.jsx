import { useState, useEffect, useRef } from "react";
import { Card, Table, Button, Badge, Form } from "react-bootstrap";
import { FaCircle, FaTrash } from "react-icons/fa";
import { notificationApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  const stompClientRef = useRef(null);


  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAllNotifications()
      console.log("Loaded notifications:", res.data.data);

      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };


  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stomp = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    stomp.onConnect = () => {
      console.log("WebSocket connected");

      const userQueue = `/queue/notifications/${user?.id}`;

      stomp.subscribe(userQueue, (payload) => {
        const newNotification = JSON.parse(payload.body);
        console.log("New WebSocket Notification:", newNotification);

        setNotifications((prev) => [newNotification, ...prev]);
      });
    };

    stomp.onStompError = (err) => {
      console.error("STOMP error:", err);
    };

    stomp.activate();
    stompClientRef.current = stomp;
  };

  useEffect(() => {
    loadNotifications();
    connectWebSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  /*
   MARK AS READ
   */
  const handleToggleRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  /** 
   *  DELETE NOTIFICATION */
  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  /** 
   *  FIXED FILTER LOGIC
   * */
  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "ALL" && n.type !== filterType) return false;


    if (filterDate && n.date !== filterDate) return false;

    return true;
  });

  return (
    <div>
      <h1 className="mb-4">Notifications</h1>

      {/* FILTERS */}
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

      {/* LIST */}
      <Card>
        <Card.Header as="h5">Notifications List</Card.Header>
        <Card.Body>
          {filteredNotifications.length > 0 ? (
            <div className="table-responsive">
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
                  {filteredNotifications.map((n) => (
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

                      <td data-label="Title">{n.title}</td>
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

                        {(user.role === "ROLE_ADMIN" ||
                          user.role === "ROLE_HR") && (
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
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p>No notifications found</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Notifications;
