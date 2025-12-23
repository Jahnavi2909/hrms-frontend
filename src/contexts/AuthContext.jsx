import { createContext, useContext, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authApi, notificationApi } from "../services/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  const stompClientRef = useRef(null);
  const soundRef = useRef(null);
  const isInitialLoad = useRef(true);
  const prevUnreadCount = useRef(0);

  useEffect(() => {
    const savedUser = Cookies.get("user");
    const savedToken = Cookies.get("token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        Cookies.remove("user");
        Cookies.remove("token");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    if (!soundRef.current) {
      soundRef.current = new Audio("/notification.mp3");
    }

    const loadNotifications = async () => {
      try {
        const res = await notificationApi.getAllNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        isInitialLoad.current = false;
      }
    };

    const handleIncoming = (payload) => {
      const newNotification = JSON.parse(payload.body);

      setNotifications(prev => {

        if (prev.some(n => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
    };

    const connectWebSocket = () => {
      const stomp = new Client({
        webSocketFactory: () =>
          new SockJS(`${API_BASE_URL}/ws?access_token=${token}`),
        reconnectDelay: 5000,
      });

      stomp.onConnect = () => {
        console.log("🔌 WebSocket connected");

        stomp.subscribe("/user/queue/notifications", handleIncoming);
        stomp.subscribe(`/topic/notifications/${user.role}`, handleIncoming);
      };

      stomp.onStompError = (frame) => {
        console.error("Broker error", frame);
      };

      stomp.activate();
      stompClientRef.current = stomp;
    };

    loadNotifications();
    connectWebSocket();

    return () => {
      stompClientRef.current?.deactivate();
    };
  }, [user, token]);


  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;

    if (
      !isInitialLoad.current &&
      unreadCount > prevUnreadCount.current
    ) {
      soundRef.current?.play().catch(() => { });
    }

    prevUnreadCount.current = unreadCount;
  }, [notifications]);


  const login = async (email, password) => {
    try {
      setError("");
      const res = await authApi.login(email, password);

      const { token, ...userData } = res.data.data;
      const finalUser = {
        ...userData,
        role: userData.role || "ROLE_EMPLOYEE",
      };

      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user", JSON.stringify(finalUser), { expires: 7 });

      setUser(finalUser);
      setToken(token);

      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    setToken(null);
    setNotifications([]);
    navigate("/login");
  };

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev =>
        prev.filter(n => n.id !== id)
      );
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        notifications,
        unreadCount,
        login,
        logout,
        markAsRead,
        deleteNotification,
        setNotifications,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
