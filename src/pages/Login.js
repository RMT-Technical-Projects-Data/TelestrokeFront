import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { getApiBaseUrl } from "../api/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/Telestroke-logo.png";
import brandBg from "../assets/bg.jpg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("rememberedUsername"))
  );
  const navigate = useNavigate();

  React.useEffect(() => {
    toast.dismiss();
    const remembered = localStorage.getItem("rememberedUsername");
    if (remembered) setUsername(remembered);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setUsernameError("");
    setPasswordError("");
    setLoginError("");

    let isValid = true;
    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }
    if (!isValid || isLoading) return;

    setIsLoading(true);

    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/auth/login`, {
        username,
        password,
      });

      const { token, role } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("Doctor", username);
        localStorage.setItem("role", role || "user");
        if (rememberMe) localStorage.setItem("rememberedUsername", username.trim());
        else localStorage.removeItem("rememberedUsername");

        toast.success("Welcome back.");
        navigate("/dashboard", { replace: true });
      } else {
        setLoginError("Invalid username or password. Please try again.");
        toast.error("Invalid username or password. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status >= 400 && error.response.status < 500) {
          const errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            "Invalid username or password. Please try again.";
          setLoginError(errorMessage);
          toast.error(errorMessage);
        } else {
          setLoginError("An error occurred while logging in. Please try again later.");
          toast.error("An error occurred while logging in. Please try again later.");
        }
      } else {
        setLoginError("Unable to connect to the server. Please check your network connection.");
        toast.error("Unable to connect to the server. Please check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ts-auth">
      <div
        className="ts-auth-bg"
        style={{ backgroundImage: `url(${brandBg})` }}
        aria-hidden="true"
      />

      <div className="ts-auth-box">
        <aside className="ts-auth-brand">
          <div className="ts-auth-brand-copy">
            <img src={logo} alt="TeleStroke" className="ts-auth-logo" />
            <h1>Remote Eyestroke Web App</h1>
          </div>
        </aside>

        <div className="ts-auth-form-wrap">
          <div className="ts-auth-form">
            <h2>Welcome</h2>

            {loginError && <div className="ts-alert ts-alert-err">{loginError}</div>}

            <form onSubmit={handleLogin}>
              <div className="ts-field">
                <label htmlFor="username">Username or Email</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError("");
                    if (loginError) setLoginError("");
                  }}
                  autoComplete="username"
                  className={`ts-auth-input ${usernameError ? "is-invalid" : ""}`}
                />
                {usernameError && <p className="ts-auth-error">{usernameError}</p>}
              </div>

              <div className="ts-field">
                <label htmlFor="password">Password</label>
                <div className="ts-auth-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                      if (loginError) setLoginError("");
                    }}
                    autoComplete="current-password"
                    className={`ts-auth-input ${passwordError ? "is-invalid" : ""}`}
                  />
                  <button
                    type="button"
                    className="ts-auth-password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && <p className="ts-auth-error">{passwordError}</p>}
              </div>

              <label className="ts-auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="ts-auth-submit"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
