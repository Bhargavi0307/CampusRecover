
import { useState } from "react";
import "./Matches.css";
import { getPossibleMatches } from "../matchUtils";

function Matches() {
  const [reports, setReports] = useState(() => {
    return JSON.parse(localStorage.getItem("reports")) || [];
  });

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [contactSent, setContactSent] = useState(false);

  // Get logged-in user
  const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser")
  );

  const currentUserEmail =
    loggedInUser?.collegeId || "";

  // Get all possible matches
  const allMatches = getPossibleMatches(reports);

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
  // ACCEPTED REQUESTS SENT BY CURRENT USER
  // ==================================================

  const acceptedSentRequests = contactRequests.filter(
    (request) =>
      request.requesterEmail === currentUserEmail &&
      request.status === "Accepted"
  );

  // ==================================================
  // POSSIBLE MATCHES
  // ==================================================

  // Remove matches for which current user already
  // has an Accepted contact request.
  const matches = allMatches.filter((match) => {
    const acceptedRequest = contactRequests.some(
      (request) =>
        request.lostId === match.lost.id &&
        request.foundId === match.found.id &&
        request.requesterEmail === currentUserEmail &&
        request.status === "Accepted"
    );

    return !acceptedRequest;
  });

  // ==================================================
  // MARK ITEM AS RECOVERED
  // ==================================================

  const handleRecovered = (lostId, foundId) => {
    const updatedReports = reports.map((report) => {
      if (
        report.id === lostId ||
        report.id === foundId
      ) {
        return {
          ...report,
          status: "Recovered",
        };
      }

      return report;
    });

    localStorage.setItem(
      "reports",
      JSON.stringify(updatedReports)
    );

    setReports(updatedReports);
    setSelectedMatch(null);
    setContactSent(false);

    alert(
      "Item marked as recovered successfully! ✅"
    );
  };

  // ==================================================
  // CONTACT FINDER
  // ==================================================

  const handleContactFinder = (match) => {
    const finderEmail = match.found.userEmail;

    if (!finderEmail) {
      alert(
        "Finder contact information is not available."
      );
      return;
    }

    if (!loggedInUser) {
      alert("Please login first.");
      return;
    }

    const existingRequests =
      JSON.parse(
        localStorage.getItem("contactRequests")
      ) || [];

    // Check duplicate request
    const alreadySent = existingRequests.some(
      (request) =>
        request.lostId === match.lost.id &&
        request.foundId === match.found.id &&
        request.requesterEmail ===
          loggedInUser.collegeId
    );

    if (alreadySent) {
      setContactSent(true);

      alert(
        "You have already sent a contact request for this match. 📩"
      );

      return;
    }

    // Create contact request
    const newRequest = {
      id: crypto.randomUUID(),

      lostId: match.lost.id,
      foundId: match.found.id,

      requesterEmail: loggedInUser.collegeId,
      requesterName:
        loggedInUser.name || "Student",

      finderEmail: finderEmail,
      finderName:
        match.found.userName || "Finder",

      itemName: match.lost.itemName,
      matchScore: match.score,

      status: "Pending",

      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "contactRequests",
      JSON.stringify([
        ...existingRequests,
        newRequest,
      ])
    );

    setContactSent(true);

    alert(
      "CONTACT REQUEST SENT SUCCESSFULLY! 📩"
    );
  };

  // ==================================================
  // ACCEPT CONTACT REQUEST
  // ==================================================

  const handleAcceptRequest = (request) => {
    const updatedRequests =
      contactRequests.map((item) => {
        if (item.id === request.id) {
          return {
            ...item,
            status: "Accepted",
            acceptedAt: new Date().toLocaleString(),
          };
        }

        return item;
      });

    localStorage.setItem(
      "contactRequests",
      JSON.stringify(updatedRequests)
    );

    alert(
      "Contact request accepted successfully! ✅"
    );

    window.location.reload();
  };

  // ==================================================
  // REJECT CONTACT REQUEST
  // ==================================================

  const handleRejectRequest = (request) => {
    const updatedRequests =
      contactRequests.map((item) => {
        if (item.id === request.id) {
          return {
            ...item,
            status: "Rejected",
          };
        }

        return item;
      });

    localStorage.setItem(
      "contactRequests",
      JSON.stringify(updatedRequests)
    );

    alert(
      "Contact request rejected."
    );

    window.location.reload();
  };

  // ==================================================
  // FIND REPORTS FOR REQUEST
  // ==================================================

  const getRequestReports = (request) => {
    const lostReport = reports.find(
      (report) => report.id === request.lostId
    );

    const foundReport = reports.find(
      (report) => report.id === request.foundId
    );

    return {
      lostReport,
      foundReport,
    };
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="matches-page">

      <div className="matches-container">

        {/* HEADER */}

        <div className="matches-header">

          <p className="matches-label">
            CAMPUS RECOVERY
          </p>

          <h1>
            Possible Matches
          </h1>

          <p>
            Our smart matching system compares lost and found
            reports to identify possible matches.
          </p>

        </div>


        {/* ================================================= */}
        {/* RECEIVED CONTACT REQUESTS */}
        {/* ================================================= */}

        {receivedRequests.length > 0 && (

          <div className="matches-list">

            {receivedRequests.map((request) => {

              const {
                lostReport,
                foundReport,
              } = getRequestReports(request);

              return (

                <div
                  className="match-card"
                  key={`request-${request.id}`}
                >

                  <div className="match-header">

                    <span className="match-badge">
                      📩 Contact Request
                    </span>

                    <span className="match-percentage">
                      {request.matchScore}% Match
                    </span>

                  </div>


                  <div className="match-details">

                    <div className="details-header">

                      <h2>
                        New Contact Request
                      </h2>

                      <span className="match-percentage">
                        {request.matchScore}% Match
                      </span>

                    </div>


                    <div className="details-content">

                      {/* REQUESTER */}

                      <div>

                        <h3>
                          👤 Student Details
                        </h3>

                        <p>
                          <strong>Name:</strong>{" "}
                          {request.requesterName}
                        </p>

                        <p>
                          <strong>Email:</strong>{" "}
                          {request.requesterEmail}
                        </p>

                        <p>
                          <strong>Request Sent:</strong>{" "}
                          {request.createdAt}
                        </p>

                      </div>


                      {/* LOST ITEM */}

                      <div>

                        <h3>
                          🔴 Lost Item
                        </h3>

                        {lostReport ? (

                          <>
                            <p>
                              <strong>Item:</strong>{" "}
                              {lostReport.itemName}
                            </p>

                            <p>
                              <strong>Category:</strong>{" "}
                              {lostReport.category}
                            </p>

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

                        ) : (

                          <p>
                            Lost report not found.
                          </p>

                        )}

                      </div>


                      {/* FOUND ITEM */}

                      <div>

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
                              <strong>Category:</strong>{" "}
                              {foundReport.category}
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

                    </div>


                    {/* ACTIONS */}

                    <div className="details-actions">

                      <button
                        className="contact-btn"
                        type="button"
                        onClick={() =>
                          handleAcceptRequest(request)
                        }
                      >
                        ✅ Accept Request
                      </button>


                      <button
                        className="recovered-btn"
                        type="button"
                        onClick={() =>
                          handleRejectRequest(request)
                        }
                      >
                        ❌ Reject Request
                      </button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}


        {/* ================================================= */}
        {/* ACCEPTED REQUESTS - SHOW TO REQUESTER */}
        {/* ================================================= */}

        {acceptedSentRequests.length > 0 && (

          <div className="matches-list">

            {acceptedSentRequests.map((request) => {

              const {
                lostReport,
                foundReport,
              } = getRequestReports(request);

              // Do not show accepted request if reports
              // are already recovered.
              if (
                !lostReport ||
                !foundReport ||
                lostReport.status === "Recovered" ||
                foundReport.status === "Recovered"
              ) {
                return null;
              }

              return (

                <div
                  className="match-card"
                  key={`accepted-${request.id}`}
                >

                  <div className="match-header">

                    <span className="match-badge">
                      ✅ Request Accepted
                    </span>

                    <span className="match-percentage">
                      {request.matchScore}% Match
                    </span>

                  </div>


                  <div className="match-details">

                    <div className="details-header">

                      <h2>
                        Your Contact Request Was Accepted!
                      </h2>

                      <span className="match-percentage">
                        {request.matchScore}% Match
                      </span>

                    </div>


                    <div className="details-content">

                      {/* FINDER DETAILS */}

                      <div>

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

                        {request.acceptedAt && (
                          <p>
                            <strong>Accepted:</strong>{" "}
                            {request.acceptedAt}
                          </p>
                        )}

                      </div>


                      {/* LOST ITEM */}

                      <div>

                        <h3>
                          🔴 Your Lost Item
                        </h3>

                        <p>
                          <strong>Item:</strong>{" "}
                          {lostReport.itemName}
                        </p>

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

                      </div>


                      {/* FOUND ITEM */}

                      <div>

                        <h3>
                          🟢 Found Item
                        </h3>

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

                      </div>

                    </div>


                    {/* CONTACT INFORMATION */}

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

                      🎉 <strong>
                        Aryan has accepted your contact request!
                      </strong>

                      <br /><br />

                      📧 <strong>
                        Finder Email:
                      </strong>{" "}
                      {request.finderEmail}

                      <br />

                      You can contact the finder to collect
                      your lost item.

                    </div>


                    {/* ACTIONS */}

                    <div className="details-actions">

                      <button
                        className="contact-btn"
                        type="button"
                        onClick={() => {
                          window.location.href =
                            `mailto:${request.finderEmail}?subject=CampusRecover - ${request.itemName}`;
                        }}
                      >
                        📧 Contact Finder
                      </button>


                      <button
                        className="recovered-btn"
                        type="button"
                        onClick={() =>
                          handleRecovered(
                            request.lostId,
                            request.foundId
                          )
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


        {/* ================================================= */}
        {/* POSSIBLE MATCHES */}
        {/* ================================================= */}

        {matches.length === 0 ? (

          <div className="no-matches">

            <div className="no-matches-icon">
              🎯
            </div>

            <h2>
              No Possible Matches Yet
            </h2>

            <p>
              We'll show a possible match when a lost and found
              report have similar details.
            </p>

          </div>

        ) : (

          <div className="matches-list">

            {matches.map((match, index) => (

              <div
                className="match-card"
                key={`${match.lost.id}-${match.found.id}`}
              >

                <div className="match-header">

                  <span className="match-badge">
                    🎯 Possible Match
                  </span>

                  <span className="match-percentage">
                    {match.score}% Match
                  </span>

                </div>


                <div className="match-items">

                  {/* LOST */}

                  <div className="match-item lost-match">

                    <span className="item-type">
                      🔴 LOST ITEM
                    </span>

                    <h2>
                      {match.lost.itemName}
                    </h2>

                    <p>
                      <strong>Category:</strong>{" "}
                      {match.lost.category}
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {match.lost.location}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {match.lost.date}
                    </p>

                  </div>


                  <div className="match-arrow">
                    ↔️
                  </div>


                  {/* FOUND */}

                  <div className="match-item found-match">

                    <span className="item-type">
                      🟢 FOUND ITEM
                    </span>

                    <h2>
                      {match.found.itemName}
                    </h2>

                    <p>
                      <strong>Category:</strong>{" "}
                      {match.found.category}
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {match.found.location}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {match.found.date}
                    </p>

                  </div>

                </div>


                {/* VIEW DETAILS */}

                <button
                  className="contact-btn"
                  type="button"
                  onClick={() => {
                    setSelectedMatch(index);
                    setContactSent(false);
                  }}
                >
                  View Match Details →
                </button>


                {/* DETAILS */}

                {selectedMatch === index && (

                  <div className="match-details">

                    <div className="details-header">

                      <h2>
                        Match Details
                      </h2>

                      <span className="match-percentage">
                        {match.score}% Match
                      </span>

                    </div>


                    <div className="details-content">

                      {/* LOST */}

                      <div>

                        <h3>
                          🔴 Lost Item
                        </h3>

                        <p>
                          <strong>Item:</strong>{" "}
                          {match.lost.itemName}
                        </p>

                        <p>
                          <strong>Category:</strong>{" "}
                          {match.lost.category}
                        </p>

                        <p>
                          <strong>Location:</strong>{" "}
                          {match.lost.location}
                        </p>

                        <p>
                          <strong>Date Lost:</strong>{" "}
                          {match.lost.date}
                        </p>

                        <p>
                          <strong>Description:</strong>{" "}
                          {match.lost.description}
                        </p>

                      </div>


                      {/* FOUND */}

                      <div>

                        <h3>
                          🟢 Found Item
                        </h3>

                        <p>
                          <strong>Item:</strong>{" "}
                          {match.found.itemName}
                        </p>

                        <p>
                          <strong>Category:</strong>{" "}
                          {match.found.category}
                        </p>

                        <p>
                          <strong>Location:</strong>{" "}
                          {match.found.location}
                        </p>

                        <p>
                          <strong>Date Found:</strong>{" "}
                          {match.found.date}
                        </p>

                        <p>
                          <strong>Description:</strong>{" "}
                          {match.found.description}
                        </p>

                        <p>
                          <strong>Finder Email:</strong>{" "}
                          {match.found.userEmail ||
                            "Not available"}
                        </p>

                      </div>

                    </div>


                    {/* CONTACT SUCCESS */}

                    {contactSent && (

                      <div
                        style={{
                          marginTop: "20px",
                          padding: "15px",
                          background: "#ecfdf5",
                          border:
                            "1px solid #86efac",
                          borderRadius: "10px",
                          color: "#166534",
                        }}
                      >

                        ✅ Contact request sent successfully!

                        <br />

                        <strong>
                          Finder Email:{" "}
                          {match.found.userEmail ||
                            "Not available"}
                        </strong>

                      </div>

                    )}


                    {/* ACTIONS */}

                    <div className="details-actions">

                      <button
                        className="contact-btn"
                        type="button"
                        onClick={() =>
                          handleContactFinder(match)
                        }
                      >
                        📩 Contact Finder
                      </button>


                      <button
                        className="recovered-btn"
                        type="button"
                        onClick={() =>
                          handleRecovered(
                            match.lost.id,
                            match.found.id
                          )
                        }
                      >
                        ✅ Mark as Recovered
                      </button>


                      <button
                        className="close-details-btn"
                        type="button"
                        onClick={() => {
                          setSelectedMatch(null);
                          setContactSent(false);
                        }}
                      >
                        Close Details
                      </button>

                    </div>

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

export default Matches;

