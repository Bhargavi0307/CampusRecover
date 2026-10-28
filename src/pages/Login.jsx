
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
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

    setLoading(true);

    try {
      const loginEmail = email.trim().toLowerCase();

      // Supabase Authentication Login
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

      if (error) {
        setErrors({
          email: "Invalid email or password.",
        });
        setLoading(false);
        return;
      }

      // Login successful
      if (data.user) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", data.user.email);

        // Get profile information
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (!profileError && profile) {
          localStorage.setItem(
            "loggedInUser",
            JSON.stringify(profile)
          );
        } else {
          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({
              id: data.user.id,
              email: data.user.email,
            })
          );
        }
      }

      alert("Login successful! 🎉");

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setErrors({
        email: "Something went wrong. Please try again.",
      });
    }

    setLoading(false);
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
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
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

