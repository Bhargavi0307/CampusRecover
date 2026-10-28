
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { supabase } from "../supabaseClient";
import { getPossibleMatches } from "../matchUtils";

function Dashboard() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Dashboard Data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get currently logged-in Supabase user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate("/login");
          return;
        }

        /*
         * ------------------------------------------------
         * 1. GET CURRENT USER'S LOST REPORTS
         * ------------------------------------------------
         */

        const {
          data: lostReports,
          error: lostError,
        } = await supabase
          .from("lost_reports")
          .select("*")
          .eq("user_id", user.id);

        if (lostError) {
          console.error(
            "Lost reports fetch error:",
            lostError
          );
        }

        /*
         * ------------------------------------------------
         * 2. GET CURRENT USER'S FOUND REPORTS
         * ------------------------------------------------
         */

        const {
          data: foundReports,
          error: foundError,
        } = await supabase
          .from("found_reports")
          .select("*")
          .eq("user_id", user.id);

        if (foundError) {
          console.error(
            "Found reports fetch error:",
            foundError
          );
        }

        /*
         * ------------------------------------------------
         * 3. FORMAT CURRENT USER REPORTS
         * ------------------------------------------------
         */

        const formattedLostReports =
          (lostReports || []).map((report) => ({
            id: report.id,
            type: "Lost",
            userId: report.user_id,
            userEmail: report.user_email,
            userName: report.user_name,
            itemName: report.item_name,
            category: report.category,
            location: report.location,
            date: report.lost_date,
            description: report.description,
            photo: report.photo,
            status: report.status,
          }));

        const formattedFoundReports =
          (foundReports || []).map((report) => ({
            id: report.id,
            type: "Found",
            userId: report.user_id,
            userEmail: report.user_email,
            userName: report.user_name,
            itemName: report.item_name,
            category: report.category,
            location: report.location,
            date: report.found_date,
            description: report.description,
            photo: report.photo,
            status: report.status,
          }));

        const userReports = [
          ...formattedLostReports,
          ...formattedFoundReports,
        ];

        setReports(userReports);

        /*
         * ------------------------------------------------
         * 4. GET ALL LOST REPORTS
         * Needed for Possible Matches
         * ------------------------------------------------
         */

        const {
          data: allLostReports,
          error: allLostError,
        } = await supabase
          .from("lost_reports")
          .select("*");

        if (allLostError) {
          console.error(
            "All lost reports fetch error:",
            allLostError
          );
        }

        /*
         * ------------------------------------------------
         * 5. GET ALL FOUND REPORTS
         * Needed for Possible Matches
         * ------------------------------------------------
         */

        const {
          data: allFoundReports,
          error: allFoundError,
        } = await supabase
          .from("found_reports")
          .select("*");

        if (allFoundError) {
          console.error(
            "All found reports fetch error:",
            allFoundError
          );
        }

        /*
         * ------------------------------------------------
         * 6. FORMAT ALL REPORTS
         * ------------------------------------------------
         */

        const formattedAllLost =
          (allLostReports || []).map((report) => ({
            id: report.id,
            type: "Lost",
            userId: report.user_id,
            userEmail: report.user_email,
            userName: report.user_name,
            itemName: report.item_name,
            category: report.category,
            location: report.location,
            date: report.lost_date,
            description: report.description,
            photo: report.photo,
            status: report.status,
          }));

        const formattedAllFound =
          (allFoundReports || []).map((report) => ({
            id: report.id,
            type: "Found",
            userId: report.user_id,
            userEmail: report.user_email,
            userName: report.user_name,
            itemName: report.item_name,
            category: report.category,
            location: report.location,
            date: report.found_date,
            description: report.description,
            photo: report.photo,
            status: report.status,
          }));

        const combinedAllReports = [
          ...formattedAllLost,
          ...formattedAllFound,
        ];

        setAllReports(combinedAllReports);

      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);


  /*
   * ------------------------------------------------
   * STATISTICS
   * ------------------------------------------------
   */

  const lostReports = reports.filter(
    (report) => report.type === "Lost"
  );

  const foundReports = reports.filter(
    (report) => report.type === "Found"
  );

  const recoveredReports = reports.filter(
    (report) => report.status === "Recovered"
  );


  /*
   * ------------------------------------------------
   * POSSIBLE MATCHES
   *
   * Use ALL users' reports.
   * matchUtils will find matches for lost/found items.
   * ------------------------------------------------
   */

  const possibleMatches = getPossibleMatches(
    allReports
  );


  /*
   * ------------------------------------------------
   * LOGOUT
   * ------------------------------------------------
   */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loggedInUser");

    navigate("/login");
  };


  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (loading) {
    return (
      <div className="dashboard-page">

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            fontSize: "18px",
          }}
        >
          Loading dashboard...
        </div>

      </div>
    );
  }


  return (
    <div className="dashboard-page">

      {/* Navbar */}
      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          🎓 CampusRecover
        </div>

        <div className="dashboard-nav">

          <span className="active-nav">
            Dashboard
          </span>

          <span
            onClick={() =>
              navigate("/my-reports")
            }
            style={{ cursor: "pointer" }}
          >
            My Reports
          </span>

          <span
            onClick={() =>
              navigate("/matches")
            }
            style={{ cursor: "pointer" }}
          >
            Possible Matches 🎯
          </span>

          <span
            onClick={() =>
              navigate("/notifications")
            }
            style={{ cursor: "pointer" }}
          >
            Notifications 🔔
          </span>

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
                onClick={() =>
                  navigate("/lost-item")
                }
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
                onClick={() =>
                  navigate("/found-item")
                }
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
            onClick={() =>
              navigate("/my-reports")
            }
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
            onClick={() =>
              navigate("/my-reports")
            }
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
            onClick={() =>
              navigate("/matches")
            }
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
            onClick={() =>
              navigate("/my-reports")
            }
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


          {reports.length === 0 ? (

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

              {reports
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
                )
                .slice(0, 5)
                .map((report) => (

                  <div
                    className="activity-item"
                    key={`${report.type}-${report.id}`}
                  >

                    <div className="activity-icon-small">
                      {report.type === "Lost"
                        ? "🔴"
                        : "🟢"}
                    </div>

                    <div className="activity-content">

                      <p>
                        {report.type === "Lost"
                          ? `You reported a lost item — ${report.itemName}`
                          : `You reported a found item — ${report.itemName}`}
                      </p>

                      <span>
                        {report.date}
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

