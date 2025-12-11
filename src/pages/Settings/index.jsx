import { useState, useEffect } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { userApi } from "../../services/api";
import "./style.css";

const Settings = () => {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.username || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Handle Profile Update 
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      await userApi.updateProfile(profile);

      setMessage("Profile updated successfully!");
      setError(null);

      setUser({
        ...user,
        name: profile.name,
        email: profile.email,
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  // Handle Change Password 
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await userApi.changePassword(passwords);

      setMessage("Password changed successfully!");
      setError(null);

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div>
      <h1 className="mb-4">Settings</h1>

      {/* Profile Update */}
      <Card className="mb-4">
        <Card.Header as="h5">Profile</Card.Header>
        <Card.Body>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleProfileSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control type="text" value={user.role} disabled />
            </Form.Group>

            <Button variant="primary" type="submit">
              Update Profile
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/*  Change Password  */}
      <Card className="mb-4">
        <Card.Header as="h5">Change Password</Card.Header>
        <Card.Body>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Change Password
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {user.role === "ROLE_ADMIN" && (
        <Card className="mb-4">
          <Card.Header as="h5">System Preferences</Card.Header>
          <Card.Body>
            <p>Here you can configure system-wide settings.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Settings;
