
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";
import { getPossibleMatches } from "../matchUtils";

function Notifications() {
  const navigate = useNavigate();

  const [reports] = useState(() => {
    return JSON.parse(localStorage.getItem("reports")) || [];
  });

  // Get logged-in user
  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser")
  );

  const currentUserEmail =
    loggedInUser?.collegeId || "";

  // Get contact requests
  const contactRequests =
    JSON.parse(
      localStorage.getItem("contactRequests")
    ) || [];

  // ==================================================
  // RECEIVED PENDING REQUESTS
  // ==================================================

  const receivedRequests = contactRequests.filter(
    (request) =>
      request.finderEmail === currentUserEmail &&
      request.status === "Pending"
  );

  // ==================================================
  // ACCEPTED REQUESTS
  // Only show if the item is NOT recovered
  // ==================================================

  const acceptedRequests = contactRequests.filter(
    (request) => {
      if (
        request.requesterEmail !== currentUserEmail ||
        request.status !== "Accepted"
      ) {
        return false;
      }

      // Find lost and found reports
      const lostReport = reports.find(
        (report) => report.id === request.lostId
      );

      const foundReport = reports.find(
        (report) => report.id === request.foundId
      );

      // If either item is recovered,
      // remove the accepted notification
      if (
        lostReport?.status === "Recovered" ||
        foundReport?.status === "Recovered"
      ) {
        return false;
      }

      return true;
    }
  );

  // ==================================================
  // GET ALL POSSIBLE MATCHES
  // ==================================================

  const allMatches = getPossibleMatches(reports);

  // ==================================================
  // POSSIBLE MATCH NOTIFICATIONS
  // Hide when request is accepted OR item is recovered
  // ==================================================

  const matchNotifications = allMatches.filter((match) => {
    const isForCurrentUser =
      match.lost.userEmail === currentUserEmail;

    // Check if contact request was accepted
    const isAlreadyAccepted = contactRequests.some(
      (request) =>
        request.lostId === match.lost.id &&
        request.foundId === match.found.id &&
        request.requesterEmail === currentUserEmail &&
        request.status === "Accepted"
    );

    // Check if item is already recovered
    const isRecovered =
      match.lost.status === "Recovered" ||
      match.found.status === "Recovered";

    return (
      isForCurrentUser &&
      !isAlreadyAccepted &&
      !isRecovered
    );
  });

  // ==================================================
  // CONTACT FINDER USING GMAIL
  // ==================================================

  const handleContactFinder = (request) => {
    const finderEmail = request.finderEmail;

    if (!finderEmail) {
      alert("Finder email is not available.");
      return;
    }

    const subject = encodeURIComponent(
      `CampusRecover - Lost Item: ${request.itemName}`
    );

    const body = encodeURIComponent(
      `Hello ${request.finderName || "Student"},

My contact request regarding my lost item "${request.itemName}" has been accepted on CampusRecover.

Lost Item: ${request.itemName}
Match Score: ${request.matchScore}%

I would like to coordinate with you to collect my lost item.

Thank you.`
    );

    // Open Gmail compose in browser
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        finderEmail
      )}&su=${subject}&body=${body}`;

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==================================================
  // CHECK IF NOTIFICATIONS EXIST
  // ==================================================

  const hasNotifications =
    matchNotifications.length > 0 ||
    receivedRequests.length > 0 ||
    acceptedRequests.length > 0;

  return (
    <div className="notifications-page">

      <div className="notifications-container">

        {/* HEADER */}

        <div className="notifications-header">

          <p className="notifications-label">
            CAMPUS RECOVERY
          </p>

          <h1>
            Notifications 🔔
          </h1>

          <p>
            Stay updated about possible matches and contact requests.
          </p>

        </div>


        {/* NO NOTIFICATIONS */}

        {!hasNotifications ? (

          <div className="no-notifications">

            <div className="notification-icon">
              🔔
            </div>

            <h2>
              No New Notifications
            </h2>

            <p>
              You'll receive a notification when there is a
              possible match or contact request.
            </p>

          </div>

        ) : (

          <div className="notification-list">

            {/* ================================================= */}
            {/* POSSIBLE MATCH NOTIFICATIONS */}
            {/* ================================================= */}

            {matchNotifications.map((notification) => (

              <div
                className="notification-card"
                key={`match-${notification.lost.id}-${notification.found.id}`}
              >

                <div className="notification-card-icon">
                  🎯
                </div>

                <div className="notification-content">

                  <div className="notification-title-row">

                    <h2>
                      New Possible Match Found!
                    </h2>

                    <span className="notification-match">
                      {notification.score}% Match
                    </span>

                  </div>

                  <p>
                    Your lost item{" "}
                    <strong>
                      "{notification.lost.itemName}"
                    </strong>{" "}
                    may match a found item{" "}
                    <strong>
                      "{notification.found.itemName}"
                    </strong>.
                  </p>

                  <p className="notification-location">
                    📍 Found at: {notification.found.location}
                  </p>

                  <button
                    className="notification-btn"
                    type="button"
                    onClick={() => navigate("/matches")}
                  >
                    View Possible Match →
                  </button>

                </div>

              </div>

            ))}


            {/* ================================================= */}
            {/* NEW CONTACT REQUEST */}
            {/* ================================================= */}

            {receivedRequests.map((request) => (

              <div
                className="notification-card"
                key={`request-${request.id}`}
              >

                <div className="notification-card-icon">
                  📩
                </div>

                <div className="notification-content">

                  <div className="notification-title-row">

                    <h2>
                      New Contact Request!
                    </h2>

                    <span className="notification-match">
                      {request.matchScore}% Match
                    </span>

                  </div>

                  <p>
                    <strong>
                      {request.requesterName}
                    </strong>{" "}
                    has sent you a contact request regarding
                    a possible lost item.
                  </p>

                  <p>
                    🎒 <strong>Item:</strong>{" "}
                    {request.itemName}
                  </p>

                  <p>
                    📧 <strong>Student Email:</strong>{" "}
                    {request.requesterEmail}
                  </p>

                  <p className="notification-location">
                    🕒 Request sent: {request.createdAt}
                  </p>

                  <button
                    className="notification-btn"
                    type="button"
                    onClick={() => navigate("/matches")}
                  >
                    View Match & Contact Request →
                  </button>

                </div>

              </div>

            ))}


            {/* ================================================= */}
            {/* ACCEPTED CONTACT REQUEST */}
            {/* ================================================= */}

            {acceptedRequests.map((request) => {

              const lostReport = reports.find(
                (report) =>
                  report.id === request.lostId
              );

              const foundReport = reports.find(
                (report) =>
                  report.id === request.foundId
              );

              return (

                <div
                  className="notification-card"
                  key={`accepted-${request.id}`}
                >

                  <div className="notification-card-icon">
                    ✅
                  </div>

                  <div className="notification-content">

                    <div className="notification-title-row">

                      <h2>
                        Request Accepted!
                      </h2>

                      <span className="notification-match">
                        {request.matchScore}% Match
                      </span>

                    </div>

                    <h2>
                      Your Contact Request Was Accepted!
                    </h2>


                    {/* FINDER DETAILS */}

                    <div style={{ marginTop: "15px" }}>

                      <h3>
                        👤 Finder Details
                      </h3>

                      <p>
                        <strong>Name:</strong>{" "}
                        {request.finderName}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {request.finderEmail}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        Request Accepted ✅
                      </p>

                    </div>


                    {/* LOST ITEM */}

                    <div style={{ marginTop: "15px" }}>

                      <h3>
                        🔴 Your Lost Item
                      </h3>

                      <p>
                        <strong>Item:</strong>{" "}
                        {lostReport?.itemName ||
                          request.itemName}
                      </p>

                      {lostReport && (
                        <>
                          <p>
                            <strong>Location:</strong>{" "}
                            {lostReport.location}
                          </p>

                          <p>
                            <strong>Date Lost:</strong>{" "}
                            {lostReport.date}
                          </p>

                          <p>
                            <strong>Description:</strong>{" "}
                            {lostReport.description}
                          </p>
                        </>
                      )}

                    </div>


                    {/* FOUND ITEM */}

                    <div style={{ marginTop: "15px" }}>

                      <h3>
                        🟢 Found Item
                      </h3>

                      {foundReport ? (

                        <>
                          <p>
                            <strong>Item:</strong>{" "}
                            {foundReport.itemName}
                          </p>

                          <p>
                            <strong>Location:</strong>{" "}
                            {foundReport.location}
                          </p>

                          <p>
                            <strong>Date Found:</strong>{" "}
                            {foundReport.date}
                          </p>

                          <p>
                            <strong>Description:</strong>{" "}
                            {foundReport.description}
                          </p>
                        </>

                      ) : (

                        <p>
                          Found report not found.
                        </p>

                      )}

                    </div>


                    {/* SUCCESS MESSAGE */}

                    <div
                      style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#ecfdf5",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        color: "#166534",
                      }}
                    >

                      🎉{" "}
                      <strong>
                        {request.finderName}
                      </strong>{" "}
                      has accepted your contact request!

                      <br />

                      📧{" "}
                      <strong>
                        Finder Email:
                      </strong>{" "}
                      {request.finderEmail}

                      <br />

                      You can contact the finder to collect
                      your lost item.

                    </div>


                    {/* ACTION BUTTONS */}

                    <div
                      className="details-actions"
                      style={{
                        marginTop: "20px",
                      }}
                    >

                      {/* CONTACT FINDER */}

                      <button
                        className="contact-btn"
                        type="button"
                        onClick={() =>
                          handleContactFinder(request)
                        }
                      >
                        📧 Contact Finder
                      </button>


                      {/* MARK RECOVERED */}

                      <button
                        className="recovered-btn"
                        type="button"
                        onClick={() =>
                          navigate("/matches")
                        }
                      >
                        ✅ Mark as Recovered
                      </button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>
  );
}

export default Notifications;

