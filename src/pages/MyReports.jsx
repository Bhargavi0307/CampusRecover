
import { useState } from "react";
import "./MyReports.css";

function MyReports() {
  const [reports] = useState(() => {
    const allReports =
      JSON.parse(localStorage.getItem("reports")) || [];

    const loggedInUser = JSON.parse(
      localStorage.getItem("loggedInUser")
    );

    if (!loggedInUser) {
      return [];
    }

    return allReports.filter(
      (report) =>
        report.userEmail === loggedInUser.collegeId
    );
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const search = searchTerm.toLowerCase().trim();

    const itemName = String(report.itemName || "").toLowerCase();
    const category = String(report.category || "").toLowerCase();
    const location = String(report.location || "").toLowerCase();

    // Search by item name, category or location
    const matchesSearch =
      search === "" ||
      itemName.includes(search) ||
      category.includes(search) ||
      location.includes(search);

    // Lost / Found filter
    const matchesType =
      typeFilter === "All" ||
      report.type === typeFilter;

    // Pending / Recovered filter
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

            {/* Search */}
            <div className="search-box">

              <span>🔍</span>

              <input
                type="text"
                placeholder="Search item, category or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />

            </div>


            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
              }}
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


            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
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

          /* No Matching Results */
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

            {filteredReports
              .slice()
              .reverse()
              .map((report) => (

                <div
                  className="report-card"
                  key={report.id}
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

                </div>

              ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default MyReports;

