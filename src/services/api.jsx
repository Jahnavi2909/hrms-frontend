import axios from "axios";
import Cookies from "js-cookie";

export const API_BASE_URL = "https://d2pa9ppytv9caa.cloudfront.net" //my cloudfront url

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// AUTO ATTACH JWT TOKEN 
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {

      Cookies.remove("token");
      Cookies.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

//  AUTH API 
export const authApi = {
  login: (email, password) =>
    api.post("/auth/login", { email, password }),
  signup: ({ username, email, password, role }) =>
    api.post("/auth/signup", { username, email, password, role }),
  forgotPassword: (data) =>
    api.post("/auth/forgot-password", data),
  resetPassword: (data) =>
    api.post("/auth/reset-password", data),
};

// EMPLOYEE API 
export const employeeApi = {
  getById: (id) => api.get(`/api/employees/${id}`),
  getAllEmployee: () => api.get("/api/employees/get-all-employees"),
  create: (data) => api.post("/api/employees", data),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  delete: (id) => api.delete(`/api/employees/${id}`),
  getEmployeeByDepartment: (id) => api.get(`/api/employees/department/${id}`),
  uploadAvatar: (id, data) => api.post(`/api/employees/${id}/avatar`, data, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }),
};

export const departmentApi = {
  getAll: () => api.get("/api/departments"),
  create: (data) => api.post("/api/departments", data),
  update: (id, data) => api.put(`/api/departments/${id}`, data),
  delete: (id) => api.delete(`/api/departments/${id}`),
};

//  ATTENDANCE API 
export const attendanceApi = {
  checkIn: (employeeId) => api.post(`/api/attendance/check-in/${employeeId}`),
  checkOut: (employeeId) => api.post(`/api/attendance/check-out/${employeeId}`),
  getTodayAttendanceByEmployee: (employeeId) => api.get(`/api/attendance/today/${employeeId}`),
  getTodayAttendance: () => api.get(`/api/attendance/today`),
  getAttendanceByDate: (date) => api.get(`/api/attendance/by-date?date=${date}`),
  getAttendanceHistory: (employeeId) => api.get(`/api/attendance/history/${employeeId}`),
  getMonthlyAttendance: (employeeId, year, month) =>
    api.get(`/api/attendance/monthly/${employeeId}`, { params: { year, month } }),
  getWeeklyTimeline(employeeId, weekStart) {
    const params = { weekStart };
    if (employeeId) params.employeeId = employeeId;
    return api.get("/api/attendance/weekly", { params });
  },
  getAttendanceByDateWithFallback: (date, employeeId) =>
    api.get("/attendance/by-date-fallback", {
      params: { date, employeeId }
    }),




};

// TASK API 
export const taskApi = {
  create: (data) => api.post("/api/tasks", data),
  update: (taskId, data) => api.put(`/api/tasks/${taskId}`, data),
  updateStatus: (taskId, data) => api.patch(`/api/tasks/${taskId}/status`, data),
  delete: (taskId) => api.delete(`/api/tasks/${taskId}`),
  getByEmployee: (employeeId) => api.get(`/api/tasks/employee/${employeeId}`),
  getAll: () => api.get("/api/tasks"),
};

// EOD API 
export const eodApi = {
  create: (data) => api.post("/api/eod", data),
  update: (id, data) => api.put(`/api/eod/${id}`, data),
  getByEmployee: (employeeCode) => api.get(`/api/eod/employee/${employeeCode}`),
  getAll: () => api.get("/api/eod"),
  delete: (id) => api.delete(`/api/eod/${id}`),
};

//  LEAVE API 
export const leaveApi = {
  apply: (data) => api.post("/api/leaves", data),
  actOnLeave: (leaveId, payload) =>
    api.post(`/api/leaves/${leaveId}/action`, payload),
  getByEmployee: (employeeId) =>
    api.get(`/api/leaves/employee/${employeeId}`),
  getAll: () => api.get("/api/leaves"),
  getPending: () => api.get("/api/leaves/pending"),
};

export const notificationApi = {
  getAllNotifications: () => api.get("/api/notifications/user"),
  getUnreadNotifications: () => api.get("/api/notifications/unread"),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`, {}),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  createNotification: (data) => api.post("/api/notifications", data),
};


export const userApi = {
  updateProfile: (data) =>
    api.put(`/api/users/update-profile`, data),

  changePassword: (data) =>
    api.put(`/api/users/change-password`, data),
};

export const payrollApi = {
  generate: (employeeId, year, month) =>
    api.post(`/api/payroll/generate`, null, {
      params: { employeeId, year, month },
    }),

  lock: (payrollId) =>
    api.post(`/api/payroll/${payrollId}/lock`),

  getByMonth: (year, month) =>
    api.get(`/api/payroll/month`, { params: { year, month } }),

  downloadPayslip: (payrollId) =>
    api.get(`/api/payroll/${payrollId}/payslip`, {
      responseType: "blob",
    }),
};
