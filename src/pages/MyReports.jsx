
import { useEffect, useState } from "react";

import { supabase } from "../supabaseClient";
import "./MyReports.css";

function MyReports() {


  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Load user's reports from Supabase
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        // Get currently logged-in Supabase user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User fetch error:", userError);

          setErrorMessage(
            "Your session has expired. Please login again."
          );

          setLoading(false);
          return;
        }

        // Fetch LOST and FOUND reports together
        const [lostResult, foundResult] = await Promise.all([
          supabase
            .from("lost_reports")
            .select("*")
            .eq("user_id", user.id),

          supabase
            .from("found_reports")
            .select("*")
            .eq("user_id", user.id),
        ]);

        const { data: lostReports, error: lostError } =
          lostResult;

        const { data: foundReports, error: foundError } =
          foundResult;

        // Check Lost reports error
        if (lostError) {
          console.error(
            "Lost reports fetch error:",
            lostError
          );

          setErrorMessage(
            "Unable to load your lost reports."
          );

          return;
        }

        // Check Found reports error
        if (foundError) {
          console.error(
            "Found reports fetch error:",
            foundError
          );

          setErrorMessage(
            "Unable to load your found reports."
          );

          return;
        }

        // Convert LOST reports
        const formattedLostReports = (lostReports || []).map(
          (report) => ({
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
            status: report.status || "Pending",
            createdAt: report.created_at,
          })
        );

        // Convert FOUND reports
        const formattedFoundReports = (foundReports || []).map(
          (report) => ({
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
            status: report.status || "Pending",
            createdAt: report.created_at,
          })
        );

        // Combine both
        const allReports = [
          ...formattedLostReports,
          ...formattedFoundReports,
        ];

        // Latest reports first
        allReports.sort((a, b) => {
          const dateA = new Date(
            a.createdAt || a.date
          ).getTime();

          const dateB = new Date(
            b.createdAt || b.date
          ).getTime();

          return dateB - dateA;
        });

        setReports(allReports);

      } catch (error) {
        console.error("My Reports error:", error);

        setErrorMessage(
          "Something went wrong while loading your reports."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const search = searchTerm.toLowerCase().trim();

    const itemName = String(
      report.itemName || ""
    ).toLowerCase();

    const category = String(
      report.category || ""
    ).toLowerCase();

    const location = String(
      report.location || ""
    ).toLowerCase();

    const matchesSearch =
      search === "" ||
      itemName.includes(search) ||
      category.includes(search) ||
      location.includes(search);

    const matchesType =
      typeFilter === "All" ||
      report.type === typeFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Recovered"
        ? report.status === "Recovered"
        : report.status !== "Recovered");

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus
    );
  });

  // Loading
  if (loading) {
    return (
      <div className="my-reports-page">
        <div
          className="my-reports-container"
          style={{
            textAlign: "center",
            paddingTop: "100px",
          }}
        >
          <h2>Loading your reports...</h2>
        </div>
      </div>
    );
  }

  // Error
  if (errorMessage) {
    return (
      <div className="my-reports-page">
        <div
          className="my-reports-container"
          style={{
            textAlign: "center",
            paddingTop: "100px",
          }}
        >
          <div className="no-reports">
            <div className="no-reports-icon">
              ⚠️
            </div>

            <h2>
              Unable to Load Reports
            </h2>

            <p>
              {errorMessage}
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reports-page">

      <div className="my-reports-container">

        {/* Header */}
        <div className="my-reports-header">

          <p className="my-reports-label">
            CAMPUS RECOVERY
          </p>

          <h1>
            My Reports
          </h1>

          <p>
            View all the lost and found items you have reported.
          </p>

        </div>

        {/* Search & Filters */}
        {reports.length > 0 && (
          <div className="reports-filters">

            <div className="search-box">

              <span>🔍</span>

              <input
                type="text"
                placeholder="Search item, category or location..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="All">
                All Reports
              </option>

              <option value="Lost">
                Lost Items
              </option>

              <option value="Found">
                Found Items
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Recovered">
                Recovered
              </option>
            </select>

          </div>
        )}

        {/* No Reports */}
        {reports.length === 0 ? (

          <div className="no-reports">

            <div className="no-reports-icon">
              📋
            </div>

            <h2>
              No Reports Yet
            </h2>

            <p>
              You haven't submitted any lost or found reports yet.
            </p>

          </div>

        ) : filteredReports.length === 0 ? (

          <div className="no-reports">

            <div className="no-reports-icon">
              🔍
            </div>

            <h2>
              No Matching Reports
            </h2>

            <p>
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          <div className="reports-list">

            {filteredReports.map((report) => (

              <div
                className="report-card"
                key={`${report.type}-${report.id}`}
              >

                <div className="report-card-top">

                  <span
                    className={
                      report.type === "Lost"
                        ? "report-badge lost-badge"
                        : "report-badge found-badge"
                    }
                  >
                    {report.type === "Lost"
                      ? "🔴 LOST"
                      : "🟢 FOUND"}
                  </span>

                  <span
                    className={
                      report.status === "Recovered"
                        ? "report-status recovered-status"
                        : "report-status"
                    }
                  >
                    {report.status === "Recovered"
                      ? "✅ Recovered"
                      : "Pending"}
                  </span>

                </div>

                <h2>
                  {report.itemName}
                </h2>

                <div className="report-details">

                  <div>
                    <strong>
                      Category
                    </strong>

                    <span>
                      {report.category}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Location
                    </strong>

                    <span>
                      {report.location}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Date
                    </strong>

                    <span>
                      {report.date}
                    </span>
                  </div>

                </div>

                <div className="report-description">

                  <strong>
                    Description
                  </strong>

                  <p>
                    {report.description}
                  </p>

                </div>

                {/* Photo */}
                {report.photo && (
                  <div style={{ marginTop: "15px" }}>
                    <img
                      src={report.photo}
                      alt={report.itemName}
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                )}

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default MyReports;

