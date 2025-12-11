import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = Cookies.get("user");
    const savedToken = Cookies.get("token");

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        Cookies.remove("user");
        Cookies.remove("token");
      }
    }

    setLoading(false);
  }, []);

  //login
  const login = async (email, password) => {
    try {
      setError("");

      const response = await authApi.login(email, password);

      if (response.data && response.data.data) {
        const { token, ...userData } = response.data.data;

        let finalUserData = { ...userData };
        if (!finalUserData.role) {
          finalUserData.role = "EMPLOYEE";
        }

        Cookies.set("token", token, { expires: 7 });
        Cookies.set("user", JSON.stringify(finalUserData), { expires: 7 });

        setUser(finalUserData);
        setToken(token);

        return { success: true };
      }

      return {
        success: false,
        message: response.data?.message || "Login failed. Please try again.",
      };
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials";

      setError(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  //signup
  const signup = async ({ username, email, password, role, secretKey }) => {
    try {
      setError("");


      if (["ADMIN", "HR", "MANAGER"].includes(role?.toUpperCase()) && secretKey !== process.env.REACT_APP_ADMIN_SECRET) {
        return { success: false, message: "Unauthorized role creation" };
      }

      const response = await authApi.signup({ username, email, password, role });

      if (response.data && response.data.data) {
        return {
          success: true,
          message: response.data.message || "Signup successful! Please login."
        };
      }

      return {
        success: false,
        message: response.data?.message || "Signup failed. Please try again."
      };

    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Logout 

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  const value = {
    user,
    loading,
    error,
    token,
    isAuthenticated: !!user,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
