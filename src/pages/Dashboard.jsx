
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { getPossibleMatches } from "../matchUtils";

function Dashboard() {
  const navigate = useNavigate();

  // Protect Dashboard
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  // Get logged-in user
  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser")
  );

  const currentUserEmail =
    loggedInUser?.collegeId || "";

  // Get ALL reports from localStorage
  const allReports = JSON.parse(
    localStorage.getItem("reports")
  ) || [];

  // Only logged-in user's reports for dashboard statistics
  const [reports] = useState(() => {
    if (!loggedInUser) {
      return [];
    }

    return allReports.filter(
      (report) =>
        report.userEmail === loggedInUser.collegeId
    );
  });

  // Only logged-in user's activities
  const [activities] = useState(() => {
    const allActivities =
      JSON.parse(localStorage.getItem("activities")) || [];

    if (!loggedInUser) {
      return [];
    }

    return allActivities.filter(
      (activity) =>
        activity.userEmail === loggedInUser.collegeId
    );
  });

  // Calculate statistics
  const lostReports = reports.filter(
    (report) => report.type === "Lost"
  );

  const foundReports = reports.filter(
    (report) => report.type === "Found"
  );

  const recoveredReports = reports.filter(
    (report) => report.status === "Recovered"
  );

  // Possible matches
  // Use ALL reports because matching should compare
  // user's lost items with other users' found items.
  const possibleMatches = getPossibleMatches(allReports).filter(
    (match) =>
      match.lost.userEmail === currentUserEmail
  );

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loggedInUser");

    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* Navbar */}
      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          🎓 CampusRecover
        </div>

        <div className="dashboard-nav">

          {/* Dashboard */}
          <span className="active-nav">
            Dashboard
          </span>

          {/* My Reports */}
          <span
            onClick={() => navigate("/my-reports")}
            style={{ cursor: "pointer" }}
          >
            My Reports
          </span>

          {/* Possible Matches */}
          <span
            onClick={() => navigate("/matches")}
            style={{ cursor: "pointer" }}
          >
            Possible Matches 🎯
          </span>

          {/* Notifications */}
          <span
            onClick={() => navigate("/notifications")}
            style={{ cursor: "pointer" }}
          >
            Notifications 🔔
          </span>

          {/* Logout */}
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>


      {/* Main Content */}
      <main className="dashboard-container">

        {/* Welcome */}
        <section className="welcome-section">

          <div>

            <p className="dashboard-label">
              CAMPUS RECOVERY CENTER
            </p>

            <h1>
              Welcome back! 👋
            </h1>

            <p>
              Manage your lost and found items from one place.
            </p>

          </div>

        </section>


        {/* Main Actions */}
        <section className="action-section">

          {/* Lost Item */}
          <div className="action-card lost-card">

            <div className="card-icon">
              🔴
            </div>

            <div className="card-content">

              <h2>
                I Lost Something
              </h2>

              <p>
                Lost an item on campus? Report it and let
                CampusRecover help you find it.
              </p>

              <button
                className="lost-btn"
                onClick={() => navigate("/lost-item")}
              >
                Report Lost Item →
              </button>

            </div>

          </div>


          {/* Found Item */}
          <div className="action-card found-card">

            <div className="card-icon">
              🟢
            </div>

            <div className="card-content">

              <h2>
                I Found Something
              </h2>

              <p>
                Found someone's belongings? Report the item
                and help its owner recover it.
              </p>

              <button
                className="found-btn"
                onClick={() => navigate("/found-item")}
              >
                Report Found Item →
              </button>

            </div>

          </div>

        </section>


        {/* Statistics */}
        <section className="stats-section">

          {/* Lost */}
          <div
            className="stat-card"
            onClick={() => navigate("/my-reports")}
            style={{ cursor: "pointer" }}
          >

            <span>🔴</span>

            <div>

              <h3>
                {lostReports.length}
              </h3>

              <p>
                My Lost Reports
              </p>

            </div>

          </div>


          {/* Found */}
          <div
            className="stat-card"
            onClick={() => navigate("/my-reports")}
            style={{ cursor: "pointer" }}
          >

            <span>🟢</span>

            <div>

              <h3>
                {foundReports.length}
              </h3>

              <p>
                My Found Reports
              </p>

            </div>

          </div>


          {/* Matches */}
          <div
            className="stat-card"
            onClick={() => navigate("/matches")}
            style={{ cursor: "pointer" }}
          >

            <span>🎯</span>

            <div>

              <h3>
                {possibleMatches.length}
              </h3>

              <p>
                Possible Matches
              </p>

            </div>

          </div>


          {/* Recovered */}
          <div
            className="stat-card"
            onClick={() => navigate("/my-reports")}
            style={{ cursor: "pointer" }}
          >

            <span>✅</span>

            <div>

              <h3>
                {recoveredReports.length}
              </h3>

              <p>
                Recovered Items
              </p>

            </div>

          </div>

        </section>


        {/* Recent Activity */}
        <section className="recent-section">

          <div className="section-heading">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Your latest CampusRecover activity
              </p>

            </div>

            <span className="activity-icon">
              🔔
            </span>

          </div>


          {activities.length === 0 ? (

            <div className="empty-activity">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No recent activity
              </h3>

              <p>
                Your lost and found reports will appear here.
              </p>

            </div>

          ) : (

            <div className="activity-list">

              {activities
                .slice()
                .reverse()
                .slice(0, 5)
                .map((activity) => (

                  <div
                    className="activity-item"
                    key={activity.id}
                  >

                    <div className="activity-icon-small">
                      {activity.type === "Lost"
                        ? "🔴"
                        : "🟢"}
                    </div>

                    <div className="activity-content">

                      <p>
                        {activity.message}
                      </p>

                      <span>
                        {activity.time}
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;

