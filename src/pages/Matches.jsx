import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Matches.css";
import { getPossibleMatches } from "../matchUtils";

function Matches() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allMatches, setAllMatches] = useState([]);
const [matchingLoading, setMatchingLoading] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [contactSent, setContactSent] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(null);

  // ==================================================
  // LOAD REPORTS FROM SUPABASE
  // ==================================================

  useEffect(() => {
    const loadReports = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User error:", userError);
          setLoading(false);
          return;
        }

        setLoggedInUser(user);

        // ==================================================
        // GET ALL LOST REPORTS
        // ==================================================

        const {
          data: lostReports,
          error: lostError,
        } = await supabase
          .from("lost_reports")
          .select("*");

        if (lostError) {
          console.error(
            "Lost reports error:",
            lostError
          );
        }

        // ==================================================
        // GET ALL FOUND REPORTS
        // ==================================================

        const {
          data: foundReports,
          error: foundError,
        } = await supabase
          .from("found_reports")
          .select("*");

        if (foundError) {
          console.error(
            "Found reports error:",
            foundError
          );
        }

        // ==================================================
        // FORMAT LOST REPORTS
        // ==================================================

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

            status: report.status || "Pending",
            createdAt: report.created_at,
          }));

        // ==================================================
        // FORMAT FOUND REPORTS
        // ==================================================

        const formattedFoundReports =
          (foundReports || []).map((report) => ({
            id: report.id,
            type: "Found",

            // Finder information
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
          }));

        // ==================================================
        // COMBINE REPORTS
        // ==================================================

        const allReports = [
          ...formattedLostReports,
          ...formattedFoundReports,
        ];

        setReports(allReports);

        // ==================================================
        // DEBUG
        // ==================================================

        console.log(
          "FORMATTED LOST REPORTS:",
          formattedLostReports
        );

        console.log(
          "FORMATTED FOUND REPORTS:",
          formattedFoundReports
        );

        console.log(
          "ALL REPORTS:",
          allReports
        );
      } catch (error) {
        console.error(
          "Matches loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // ==================================================
  // CURRENT USER
  // ==================================================

  const currentUserId =
    loggedInUser?.id || "";

  const currentUserEmail =
    loggedInUser?.email || "";

  // ==================================================
  // GET ALL POSSIBLE MATCHES
  // ==================================================

 useEffect(() => {
  let cancelled = false;

  const calculateMatches = async () => {
    if (reports.length === 0) {
      setAllMatches([]);
      return;
    }

    setMatchingLoading(true);

    try {
      const results = await getPossibleMatches(reports);

      if (!cancelled) {
        setAllMatches(results);
        console.log("ALL MATCHES:", results);
      }
    } catch (error) {
      console.error("Matching error:", error);

      if (!cancelled) {
        setAllMatches([]);
      }
    } finally {
      if (!cancelled) {
        setMatchingLoading(false);
      }
    }
  };

  calculateMatches();

  return () => {
    cancelled = true;
  };
}, [reports]);

  console.log(
    "ALL MATCHES:",
    allMatches
  );

  console.log(
    "CURRENT USER:",
    loggedInUser
  );

  console.log(
    "CURRENT USER ID:",
    currentUserId
  );

  // ==================================================
  // ONLY SHOW MATCHES INVOLVING CURRENT USER
  // ==================================================

  const userMatches =
    allMatches.filter(
      (match) =>
        match.lost.userId ===
          currentUserId ||
        match.found.userId ===
          currentUserId
    );

  // ==================================================
  // CONTACT REQUESTS
  // ==================================================

  const contactRequests =
    JSON.parse(
      localStorage.getItem(
        "contactRequests"
      )
    ) || [];

  // ==================================================
  // RECEIVED PENDING REQUESTS
  // ==================================================

  const receivedRequests =
    contactRequests.filter(
      (request) =>
        request.finderEmail ===
          currentUserEmail &&
        request.status === "Pending"
    );

  // ==================================================
  // ACCEPTED REQUESTS SENT BY CURRENT USER
  // ==================================================

  const acceptedSentRequests =
    contactRequests.filter(
      (request) =>
        request.requesterEmail ===
          currentUserEmail &&
        request.status === "Accepted"
    );

  // ==================================================
  // POSSIBLE MATCHES
  // ==================================================

  const matches =
    userMatches.filter((match) => {
      const acceptedRequest =
        contactRequests.some(
          (request) =>
            String(request.lostId) ===
              String(match.lost.id) &&
            String(request.foundId) ===
              String(match.found.id) &&
            request.requesterEmail ===
              currentUserEmail &&
            request.status === "Accepted"
        );

      return !acceptedRequest;
    });

  // ==================================================
  // GET EXACT LOST REPORT
  // ==================================================

  const getExactLostReport = (reportId) => {
    return reports.find(
      (report) =>
        report.type === "Lost" &&
        String(report.id) ===
          String(reportId)
    );
  };

  // ==================================================
  // GET EXACT FOUND REPORT
  // ==================================================

  const getExactFoundReport = (reportId) => {
    return reports.find(
      (report) =>
        report.type === "Found" &&
        String(report.id) ===
          String(reportId)
    );
  };

  // ==================================================
  // MARK ITEM AS RECOVERED
  // ==================================================

  const handleRecovered = async (
    lostId,
    foundId
  ) => {
    if (!loggedInUser) {
      alert("Please login first.");
      return;
    }

    const confirmRecovery =
      window.confirm(
        "Are you sure you want to mark this item as recovered?"
      );

    if (!confirmRecovery) {
      return;
    }

    try {
      // ==================================================
      // UPDATE LOST REPORT
      // ==================================================

      const {
        data: lostUpdated,
        error: lostError,
      } = await supabase
        .from("lost_reports")
        .update({
          status: "Recovered",
        })
        .eq("id", lostId)
        .select();

      if (lostError) {
        console.error(
          "LOST REPORT UPDATE ERROR:",
          lostError
        );

        alert(
          `Failed to update lost report.\n\n${lostError.message}`
        );

        return;
      }

      // ==================================================
      // UPDATE FOUND REPORT
      // ==================================================

      const {
        data: foundUpdated,
        error: foundError,
      } = await supabase
        .from("found_reports")
        .update({
          status: "Recovered",
        })
        .eq("id", foundId)
        .select();

      if (foundError) {
        console.error(
          "FOUND REPORT UPDATE ERROR:",
          foundError
        );

        alert(
          `Failed to update found report.\n\n${foundError.message}`
        );

        return;
      }

      // ==================================================
      // CHECK UPDATE
      // ==================================================

      if (
        !lostUpdated ||
        lostUpdated.length === 0
      ) {
        alert(
          "Lost report could not be updated. Please check Supabase permissions."
        );

        return;
      }

      if (
        !foundUpdated ||
        foundUpdated.length === 0
      ) {
        alert(
          "Found report could not be updated. Please check Supabase permissions."
        );

        return;
      }

      // ==================================================
      // UPDATE FRONTEND STATE
      // ==================================================

      setReports(
        (previousReports) =>
          previousReports.map(
            (report) => {
              if (
                report.type === "Lost" &&
                String(report.id) ===
                  String(lostId)
              ) {
                return {
                  ...report,
                  status: "Recovered",
                };
              }

              if (
                report.type === "Found" &&
                String(report.id) ===
                  String(foundId)
              ) {
                return {
                  ...report,
                  status: "Recovered",
                };
              }

              return report;
            }
          )
      );

      setSelectedMatch(null);
      setContactSent(false);

      alert(
        "Item marked as recovered successfully! ✅"
      );
    } catch (error) {
      console.error(
        "RECOVERY ERROR:",
        error
      );

      alert(
        "Something went wrong while marking the item as recovered."
      );
    }
  };

  // ==================================================
  // CONTACT FINDER
  // ==================================================

  const handleContactFinder = (
    match
  ) => {
    if (!match || !loggedInUser) {
      alert("Please login first.");
      return;
    }

    // ==================================================
    // GET EXACT LOST REPORT
    // ==================================================

    const exactLostReport =
      getExactLostReport(
        match.lost.id
      );

    // ==================================================
    // GET EXACT FOUND REPORT
    // ==================================================

    const exactFoundReport =
      getExactFoundReport(
        match.found.id
      );

    // ==================================================
    // FINDER = FOUND REPORT USER
    // ==================================================

    const finderEmail =
      exactFoundReport?.userEmail || "";

    const finderName =
      exactFoundReport?.userName ||
      "Finder";

    console.log(
      "========== CONTACT FINDER DEBUG =========="
    );

    console.log(
      "MATCH:",
      match
    );

    console.log(
      "EXACT LOST REPORT:",
      exactLostReport
    );

    console.log(
      "EXACT FOUND REPORT:",
      exactFoundReport
    );

    console.log(
      "LOST USER EMAIL:",
      exactLostReport?.userEmail
    );

    console.log(
      "FOUND USER EMAIL:",
      exactFoundReport?.userEmail
    );

    console.log(
      "FINAL FINDER EMAIL:",
      finderEmail
    );

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!finderEmail) {
      alert(
        "Finder contact information is not available."
      );

      return;
    }

    // ==================================================
    // CURRENT USER
    // ==================================================

    const requesterEmail =
      loggedInUser.email;

    // ==================================================
    // EXISTING REQUESTS
    // ==================================================

    const existingRequests =
      JSON.parse(
        localStorage.getItem(
          "contactRequests"
        )
      ) || [];

    // ==================================================
    // DUPLICATE REQUEST CHECK
    // ==================================================

    const alreadySent =
      existingRequests.some(
        (request) =>
          String(request.lostId) ===
            String(
              exactLostReport?.id
            ) &&
          String(request.foundId) ===
            String(
              exactFoundReport?.id
            ) &&
          request.requesterEmail ===
            requesterEmail
      );

    if (alreadySent) {
      setContactSent(true);

      alert(
        "You have already sent a contact request for this match. 📩"
      );

      return;
    }

    // ==================================================
    // CREATE CONTACT REQUEST
    // ==================================================

    const newRequest = {
      id: crypto.randomUUID(),

      lostId:
        exactLostReport.id,

      foundId:
        exactFoundReport.id,

      // Person who lost item
      requesterEmail:
        exactLostReport.userEmail ||
        requesterEmail,

      requesterName:
        exactLostReport.userName ||
        "Student",

      // Person who found item
      finderEmail:
        finderEmail,

      finderName:
        finderName,

      itemName:
        exactLostReport.itemName,

      matchScore:
        match.score,

      status: "Pending",

      createdAt:
        new Date().toLocaleString(),
    };

    console.log(
      "========== NEW CONTACT REQUEST =========="
    );

    console.log(
      "REQUESTER:",
      newRequest.requesterEmail
    );

    console.log(
      "FINDER:",
      newRequest.finderEmail
    );

    console.log(
      "FINDER NAME:",
      newRequest.finderName
    );

    console.log(
      "NEW REQUEST:",
      newRequest
    );

    // ==================================================
    // SAVE REQUEST
    // ==================================================

    localStorage.setItem(
      "contactRequests",
      JSON.stringify([
        ...existingRequests,
        newRequest,
      ])
    );

    setContactSent(true);

    alert(
      `CONTACT REQUEST SENT SUCCESSFULLY! 📩\n\nFinder: ${finderEmail}`
    );
  };

  // ==================================================
  // ACCEPT CONTACT REQUEST
  // ==================================================

  const handleAcceptRequest = (
    request
  ) => {
    const updatedRequests =
      contactRequests.map(
        (item) => {
          if (
            item.id === request.id
          ) {
            return {
              ...item,
              status: "Accepted",
              acceptedAt:
                new Date().toLocaleString(),
            };
          }

          return item;
        }
      );

    localStorage.setItem(
      "contactRequests",
      JSON.stringify(
        updatedRequests
      )
    );

    alert(
      "Contact request accepted successfully! ✅"
    );

    window.location.reload();
  };

  // ==================================================
  // REJECT CONTACT REQUEST
  // ==================================================

  const handleRejectRequest = (
    request
  ) => {
    const updatedRequests =
      contactRequests.map(
        (item) => {
          if (
            item.id === request.id
          ) {
            return {
              ...item,
              status: "Rejected",
            };
          }

          return item;
        }
      );

    localStorage.setItem(
      "contactRequests",
      JSON.stringify(
        updatedRequests
      )
    );

    alert(
      "Contact request rejected."
    );

    window.location.reload();
  };

  // ==================================================
  // FIND REPORTS FOR REQUEST
  // ==================================================

  const getRequestReports = (
    request
  ) => {
    const lostReport =
      reports.find(
        (report) =>
          report.type === "Lost" &&
          String(report.id) ===
            String(
              request.lostId
            )
      );

    const foundReport =
      reports.find(
        (report) =>
          report.type === "Found" &&
          String(report.id) ===
            String(
              request.foundId
            )
      );

    console.log(
      "REQUEST REPORT DEBUG:",
      {
        request,
        lostReport,
        foundReport,
        finderEmail:
          foundReport?.userEmail,
      }
    );

    return {
      lostReport,
      foundReport,
    };
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="matches-page">
        <div
          className="matches-container"
          style={{
            textAlign: "center",
            paddingTop: "100px",
          }}
        >
          <h2>
            Finding possible matches...
          </h2>
        </div>
      </div>
    );
  }

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
            Our smart matching system compares lost and
            found reports to identify possible matches.
          </p>
        </div>

        {/* ================================================= */}
        {/* RECEIVED CONTACT REQUESTS */}
        {/* ================================================= */}

        {receivedRequests.length > 0 && (
          <div className="matches-list">

            {receivedRequests.map(
              (request) => {

                const {
                  lostReport,
                  foundReport,
                } =
                  getRequestReports(
                    request
                  );

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
                            <strong>
                              Name:
                            </strong>{" "}
                            {
                              request.requesterName
                            }
                          </p>

                          <p>
                            <strong>
                              Email:
                            </strong>{" "}
                            {
                              request.requesterEmail
                            }
                          </p>

                          <p>
                            <strong>
                              Request Sent:
                            </strong>{" "}
                            {
                              request.createdAt
                            }
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
                                <strong>
                                  Item:
                                </strong>{" "}
                                {
                                  lostReport.itemName
                                }
                              </p>

                              <p>
                                <strong>
                                  Category:
                                </strong>{" "}
                                {
                                  lostReport.category
                                }
                              </p>

                              <p>
                                <strong>
                                  Location:
                                </strong>{" "}
                                {
                                  lostReport.location
                                }
                              </p>

                              <p>
                                <strong>
                                  Date Lost:
                                </strong>{" "}
                                {
                                  lostReport.date
                                }
                              </p>

                              <p>
                                <strong>
                                  Description:
                                </strong>{" "}
                                {
                                  lostReport.description
                                }
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
                                <strong>
                                  Item:
                                </strong>{" "}
                                {
                                  foundReport.itemName
                                }
                              </p>

                              <p>
                                <strong>
                                  Category:
                                </strong>{" "}
                                {
                                  foundReport.category
                                }
                              </p>

                              <p>
                                <strong>
                                  Location:
                                </strong>{" "}
                                {
                                  foundReport.location
                                }
                              </p>

                              <p>
                                <strong>
                                  Date Found:
                                </strong>{" "}
                                {
                                  foundReport.date
                                }
                              </p>

                              <p>
                                <strong>
                                  Description:
                                </strong>{" "}
                                {
                                  foundReport.description
                                }
                              </p>
                            </>
                          ) : (
                            <p>
                              Found report not found.
                            </p>
                          )}

                        </div>

                      </div>

                      <div className="details-actions">

                        <button
                          className="contact-btn"
                          type="button"
                          onClick={() =>
                            handleAcceptRequest(
                              request
                            )
                          }
                        >
                          ✅ Accept Request
                        </button>

                        <button
                          className="recovered-btn"
                          type="button"
                          onClick={() =>
                            handleRejectRequest(
                              request
                            )
                          }
                        >
                          ❌ Reject Request
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

        {/* ================================================= */}
        {/* ACCEPTED REQUESTS */}
        {/* ================================================= */}

        {acceptedSentRequests.length > 0 && (
          <div className="matches-list">

            {acceptedSentRequests.map(
              (request) => {

                const {
                  lostReport,
                  foundReport,
                } =
                  getRequestReports(
                    request
                  );

                if (
                  !lostReport ||
                  !foundReport ||
                  lostReport.status ===
                    "Recovered" ||
                  foundReport.status ===
                    "Recovered"
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

                        {/* FINDER */}

                        <div>

                          <h3>
                            👤 Finder Details
                          </h3>

                          <p>
                            <strong>
                              Name:
                            </strong>{" "}
                            {
                              request.finderName
                            }
                          </p>

                          <p>
                            <strong>
                              Email:
                            </strong>{" "}
                            {
                              request.finderEmail
                            }
                          </p>

                          <p>
                            <strong>
                              Status:
                            </strong>{" "}
                            Request Accepted ✅
                          </p>

                          {request.acceptedAt && (
                            <p>
                              <strong>
                                Accepted:
                              </strong>{" "}
                              {
                                request.acceptedAt
                              }
                            </p>
                          )}

                        </div>

                        {/* LOST */}

                        <div>

                          <h3>
                            🔴 Your Lost Item
                          </h3>

                          <p>
                            <strong>
                              Item:
                            </strong>{" "}
                            {
                              lostReport.itemName
                            }
                          </p>

                          <p>
                            <strong>
                              Location:
                            </strong>{" "}
                            {
                              lostReport.location
                            }
                          </p>

                          <p>
                            <strong>
                              Date Lost:
                            </strong>{" "}
                            {
                              lostReport.date
                            }
                          </p>

                          <p>
                            <strong>
                              Description:
                            </strong>{" "}
                            {
                              lostReport.description
                            }
                          </p>

                        </div>

                        {/* FOUND */}

                        <div>

                          <h3>
                            🟢 Found Item
                          </h3>

                          <p>
                            <strong>
                              Item:
                            </strong>{" "}
                            {
                              foundReport.itemName
                            }
                          </p>

                          <p>
                            <strong>
                              Location:
                            </strong>{" "}
                            {
                              foundReport.location
                            }
                          </p>

                          <p>
                            <strong>
                              Date Found:
                            </strong>{" "}
                            {
                              foundReport.date
                            }
                          </p>

                          <p>
                            <strong>
                              Description:
                            </strong>{" "}
                            {
                              foundReport.description
                            }
                          </p>

                        </div>

                      </div>

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

                        🎉{" "}
                        <strong>
                          {
                            request.finderName
                          }{" "}
                          has accepted your
                          contact request!
                        </strong>

                        <br />
                        <br />

                        📧{" "}
                        <strong>
                          Finder Email:
                        </strong>{" "}
                        {
                          request.finderEmail
                        }

                        <br />

                        You can contact the finder to
                        collect your lost item.

                      </div>

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
              }
            )}

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
              We'll show a possible match when a lost and
              found report have similar details.
            </p>

          </div>

        ) : (

          <div className="matches-list">

            {matches.map(
              (match, index) => {

                const exactFoundReport =
                  getExactFoundReport(
                    match.found.id
                  );

                const exactLostReport =
                  getExactLostReport(
                    match.lost.id
                  );

                return (
                  <div
                    className="match-card"
                    key={`${match.lost.type}-${match.lost.id}-${match.found.type}-${match.found.id}`}
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
                          {
                            exactLostReport?.itemName ||
                            match.lost.itemName
                          }
                        </h2>

                        <p>
                          <strong>
                            Category:
                          </strong>{" "}
                          {
                            exactLostReport?.category ||
                            match.lost.category
                          }
                        </p>

                        <p>
                          <strong>
                            Location:
                          </strong>{" "}
                          {
                            exactLostReport?.location ||
                            match.lost.location
                          }
                        </p>

                        <p>
                          <strong>
                            Date:
                          </strong>{" "}
                          {
                            exactLostReport?.date ||
                            match.lost.date
                          }
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
                          {
                            exactFoundReport?.itemName ||
                            match.found.itemName
                          }
                        </h2>

                        <p>
                          <strong>
                            Category:
                          </strong>{" "}
                          {
                            exactFoundReport?.category ||
                            match.found.category
                          }
                        </p>

                        <p>
                          <strong>
                            Location:
                          </strong>{" "}
                          {
                            exactFoundReport?.location ||
                            match.found.location
                          }
                        </p>

                        <p>
                          <strong>
                            Date:
                          </strong>{" "}
                          {
                            exactFoundReport?.date ||
                            match.found.date
                          }
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
                              <strong>
                                Item:
                              </strong>{" "}
                              {
                                exactLostReport?.itemName ||
                                match.lost.itemName
                              }
                            </p>

                            <p>
                              <strong>
                                Category:
                              </strong>{" "}
                              {
                                exactLostReport?.category ||
                                match.lost.category
                              }
                            </p>

                            <p>
                              <strong>
                                Location:
                              </strong>{" "}
                              {
                                exactLostReport?.location ||
                                match.lost.location
                              }
                            </p>

                            <p>
                              <strong>
                                Date Lost:
                              </strong>{" "}
                              {
                                exactLostReport?.date ||
                                match.lost.date
                              }
                            </p>

                            <p>
                              <strong>
                                Description:
                              </strong>{" "}
                              {
                                exactLostReport?.description ||
                                match.lost.description
                              }
                            </p>

                          </div>

                          {/* FOUND */}

                          <div>

                            <h3>
                              🟢 Found Item
                            </h3>

                            <p>
                              <strong>
                                Item:
                              </strong>{" "}
                              {
                                exactFoundReport?.itemName ||
                                match.found.itemName
                              }
                            </p>

                            <p>
                              <strong>
                                Category:
                              </strong>{" "}
                              {
                                exactFoundReport?.category ||
                                match.found.category
                              }
                            </p>

                            <p>
                              <strong>
                                Location:
                              </strong>{" "}
                              {
                                exactFoundReport?.location ||
                                match.found.location
                              }
                            </p>

                            <p>
                              <strong>
                                Date Found:
                              </strong>{" "}
                              {
                                exactFoundReport?.date ||
                                match.found.date
                              }
                            </p>

                            <p>
                              <strong>
                                Description:
                              </strong>{" "}
                              {
                                exactFoundReport?.description ||
                                match.found.description
                              }
                            </p>

                            {/* FINDER EMAIL */}

                            <p>
                              <strong>
                                Finder Email:
                              </strong>{" "}
                              {
                                exactFoundReport?.userEmail ||
                                "Not available"
                              }
                            </p>

                            {/* FINDER NAME */}

                            <p>
                              <strong>
                                Finder Name:
                              </strong>{" "}
                              {
                                exactFoundReport?.userName ||
                                "Not available"
                              }
                            </p>

                          </div>

                        </div>

                        {/* CONTACT SUCCESS */}

                        {contactSent && (

                          <div
                            style={{
                              marginTop: "20px",
                              padding: "15px",
                              background:
                                "#ecfdf5",
                              border:
                                "1px solid #86efac",
                              borderRadius:
                                "10px",
                              color:
                                "#166534",
                            }}
                          >

                            ✅ Contact request sent
                            successfully!

                            <br />

                            <strong>
                              Finder Email:{" "}
                              {
                                exactFoundReport?.userEmail ||
                                "Not available"
                              }
                            </strong>

                          </div>

                        )}

                        {/* ACTIONS */}

                        <div className="details-actions">

                          <button
                            className="contact-btn"
                            type="button"
                            onClick={() =>
                              handleContactFinder(
                                match
                              )
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
                              setSelectedMatch(
                                null
                              );
                              setContactSent(
                                false
                              );
                            }}
                          >
                            Close Details
                          </button>

                        </div>

                      </div>

                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default Matches;