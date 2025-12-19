import './App.css';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Sidebar from './contexts/layout/Sidebar';
import Header from './contexts/layout/Header';
import Employee from './pages/Employee';
import EmployeeProfile from './pages/EmployeeProfile';
import Leaves from './pages/Leaves';
import Tasks from './pages/Tasks';
import EndOfTheDayReport from './pages/EndOfTheDayReport';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Department from './pages/Department';
import Unauthorized from './pages/Unauthorized';
import ForgotPassword from './pages/Password/ForgotPassword';


// Private Route Component
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};



const AppLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <main className="p-4">
          {children}
        </main>
      </div>
    </div >
  )
}

// Main App Component

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/attendance" element={
            <PrivateRoute>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="employees/:id" element={
            <PrivateRoute>
              <AppLayout>
                <EmployeeProfile />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/employees" element={
            <PrivateRoute>
              <AppLayout>
                <Employee />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/leaves" element={
            <PrivateRoute>
              <AppLayout>
                <Leaves />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute>
              <AppLayout>
                <Tasks />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/eod-report" element={
            <PrivateRoute>
              <AppLayout>
                <EndOfTheDayReport />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/departments" element={
            <PrivateRoute>
              <AppLayout>
                <Department />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <AppLayout>
                <EmployeeProfile />
              </AppLayout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
