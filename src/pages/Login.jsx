import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const newErrors = {};

    // Basic validation
    if (!email.trim()) {
      newErrors.email = "Please enter your college email or ID.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    }

    setErrors(newErrors);

    // Stop if validation errors exist
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Get all registered users
    const existingUsers =
      JSON.parse(localStorage.getItem("users")) || [];

    // Check if account exists
    if (existingUsers.length === 0) {
      setErrors({
        email: "No account found. Please create an account first.",
      });
      return;
    }

    // Find user with matching College Email / ID
    const savedUser = existingUsers.find(
      (user) =>
        user.collegeId.toLowerCase() ===
        email.trim().toLowerCase()
    );

    // User not found
    if (!savedUser) {
      setErrors({
        email: "No account found with this College Email / ID.",
      });
      return;
    }

    // Check password
    if (password !== savedUser.password) {
      setErrors({
        password: "Invalid password.",
      });
      return;
    }

    // Login successful
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem(
      "userEmail",
      savedUser.collegeId
    );

    // Save logged-in user's information
    localStorage.setItem(
      "loggedInUser",
      JSON.stringify(savedUser)
    );

    alert("Login successful! 🎉");

    navigate("/dashboard");
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          🎓
        </div>

        <h1>
          Welcome Back!
        </h1>

        <p className="login-subtitle">
          Login to your CampusRecover account
        </p>

        <form onSubmit={handleLogin}>

          {/* Email / College ID */}
          <div className="input-group">

            <label>
              Email / College ID
            </label>

            <input
              type="text"
              placeholder="Enter your email or college ID"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
            />

            {errors.email && (
              <p className="error-message">
                {errors.email}
              </p>
            )}

          </div>


          {/* Password */}
          <div className="input-group">

            <label>
              Password
            </label>

            <div className="password-box">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({});
                }}
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

            {errors.password && (
              <p className="error-message">
                {errors.password}
              </p>
            )}

          </div>


          {/* Options */}
          <div className="login-options">

            <label>
              <input type="checkbox" />
              Remember me
            </label>

            <a href="#">
              Forgot Password?
            </a>

          </div>


          {/* Login Button */}
          <button
            type="submit"
            className="login-submit"
          >
            Login
          </button>

        </form>


        {/* Signup */}
        <p className="signup-text">

          Don't have an account?

          <a href="/signup">
            {" "}Sign Up
          </a>

        </p>

      </div>

    </div>
  );
}

export default Login;