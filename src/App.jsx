import "./App.css";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LostItem from "./pages/LostItem";
import FoundItem from "./pages/FoundItem";
import MyReports from "./pages/MyReports";
import Matches from "./pages/Matches";
import Notifications from "./pages/Notifications";


function ProtectedRoute({ children }) {

  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function Home() {
  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">

        <div className="logo">
          🎓 CampusRecover
        </div>

        <div className="nav-links">

          <Link to="/">Home</Link>

          <a href="#how-it-works">
            How it Works
          </a>

          <a href="#about">
            About
          </a>

          <Link to="/login">
            <button className="login-btn">
              Login
            </button>
          </Link>

        </div>

      </nav>


      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">

          <p className="tagline">
            SMART CAMPUS LOST & FOUND
          </p>

          <h1>
            Lost Something?
            <br />
            <span>Let's Help You Find It.</span>
          </h1>

          <p className="hero-description">
            CampusRecover helps students report lost and found items,
            discover possible matches and recover their belongings faster.
          </p>

          <div className="hero-buttons">

            <button className="lost-btn">
              🔴 I Lost Something
            </button>

            <Link to="/found-item">
              <button className="found-btn">
                🟢 I Found Something
              </button>
            </Link>

          </div>

        </div>

      </section>


      {/* How It Works */}
      <section
        className="how-it-works"
        id="how-it-works"
      >

        <h2>
          How CampusRecover Works
        </h2>

        <p className="section-description">
          Report your lost item and let our system help you find a possible match.
        </p>

        <div className="steps">

          <div className="step">

            <div className="step-number">
              01
            </div>

            <h3>
              Report
            </h3>

            <p>
              Report an item you lost or found on campus.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              02
            </div>

            <h3>
              Smart Matching
            </h3>

            <p>
              Our system looks for possible matches between lost and found items.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              03
            </div>

            <h3>
              Get Notified
            </h3>

            <p>
              Get notified when a possible match is found.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              04
            </div>

            <h3>
              Recover
            </h3>

            <p>
              Connect with the finder and recover your belongings.
            </p>

          </div>

        </div>

      </section>


      {/* Statistics */}
      <section className="stats">

        <div className="stat">
          <h2>126</h2>
          <p>Lost Reports</p>
        </div>

        <div className="stat">
          <h2>94</h2>
          <p>Found Reports</p>
        </div>

        <div className="stat">
          <h2>62</h2>
          <p>Items Recovered</p>
        </div>

      </section>


      {/* Footer */}
      <footer
        className="footer"
        id="about"
      >

        <h3>
          🎓 CampusRecover
        </h3>

        <p>
          Helping students find what they lost on campus.
        </p>

        <p className="copyright">
          © 2026 CampusRecover
        </p>

      </footer>

    </div>
  );
}


function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Home Page */}
        <Route
          path="/"
          element={<Home />}
        />


        {/* Login Page */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* Signup Page */}
        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* Protected Lost Item */}
        <Route
          path="/lost-item"
          element={
            <ProtectedRoute>
              <LostItem />
            </ProtectedRoute>
          }
        />


        {/* Protected Found Item */}
        <Route
          path="/found-item"
          element={
            <ProtectedRoute>
              <FoundItem />
            </ProtectedRoute>
          }
        />


        {/* Protected My Reports */}
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />


        {/* Protected Matches */}
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />


        {/* Protected Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;

