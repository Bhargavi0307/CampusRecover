
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Signup.css";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Full Name
    if (!name.trim()) {
      newErrors.name = "Please enter your full name.";
    }

    // College Email / ID
    if (!collegeId.trim()) {
      newErrors.collegeId =
        "Please enter your college email or ID.";
    }

    // Password
    if (!password) {
      newErrors.password =
        "Please enter a password.";
    } else if (password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }

    // Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    // Stop if validation errors exist
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const email = collegeId.trim().toLowerCase();

      // College Email / ID must be a valid email
      if (!email.includes("@")) {
        setErrors({
          collegeId:
            "Please enter a valid college email address.",
        });
        setLoading(false);
        return;
      }

      // Create account in Supabase Authentication
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setErrors({
          collegeId: error.message,
        });
        setLoading(false);
        return;
      }

      alert("Account created successfully! 🎉");

      navigate("/login");

    } catch (error) {
      console.error("Signup error:", error);

      setErrors({
        collegeId:
          "Something went wrong. Please try again.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">

      <div className="signup-card">

        <div className="signup-logo">
          🎓
        </div>

        <h1>
          Create Account
        </h1>

        <p className="signup-subtitle">
          Join CampusRecover and help make your campus safer
        </p>

        <form onSubmit={handleSignup}>

          {/* Full Name */}
          <div className="input-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            {errors.name && (
              <p className="error-message">
                {errors.name}
              </p>
            )}

          </div>

          {/* College Email / ID */}
          <div className="input-group">

            <label>
              College Email / ID
            </label>

            <input
              type="text"
              placeholder="Enter your college email"
              value={collegeId}
              onChange={(e) =>
                setCollegeId(e.target.value)
              }
            />

            {errors.collegeId && (
              <p className="error-message">
                {errors.collegeId}
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
                placeholder="Create a password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
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

          {/* Confirm Password */}
          <div className="input-group">

            <label>
              Confirm Password
            </label>

            <div className="password-box">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

            {errors.confirmPassword && (
              <p className="error-message">
                {errors.confirmPassword}
              </p>
            )}

          </div>

          {/* Submit */}
          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        {/* Login */}
        <p className="login-text">

          Already have an account?

          <a href="/login">
            {" "}Login
          </a>

        </p>

      </div>

    </div>
  );
}

export default Signup;

