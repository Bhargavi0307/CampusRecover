// ===============================
// Calculate similarity between item names
// ===============================
export function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const a = String(name1).toLowerCase().trim();
  const b = String(name2).toLowerCase().trim();

  // Exact match
  if (a === b) {
    return 1;
  }

  // One name contains the other
  if (a.includes(b) || b.includes(a)) {
    return 0.8;
  }

  // Compare individual words
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  const commonWords = wordsA.filter((word) =>
    wordsB.includes(word)
  );

  if (commonWords.length > 0) {
    return (
      commonWords.length /
      Math.max(wordsA.length, wordsB.length)
    );
  }

  return 0;
}


// ===============================
// Calculate location similarity
// ===============================
export function calculateLocationSimilarity(
  location1,
  location2
) {
  if (!location1 || !location2) return 0;

  const a = String(location1).toLowerCase().trim();
  const b = String(location2).toLowerCase().trim();

  // Exact location
  if (a === b) {
    return 1;
  }

  // Similar location text
  if (a.includes(b) || b.includes(a)) {
    return 0.7;
  }

  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  const commonWords = wordsA.filter((word) =>
    wordsB.includes(word)
  );

  if (commonWords.length > 0) {
    return (
      commonWords.length /
      Math.max(wordsA.length, wordsB.length)
    );
  }

  return 0;
}


// ===============================
// Calculate complete match score
// ===============================
export function calculateMatchScore(lost, found) {
  if (!lost || !found) return 0;

  // Item name = 50%
  const nameSimilarity = calculateNameSimilarity(
    lost.itemName,
    found.itemName
  );

  // Category = 30%
  const categoryMatch =
    String(lost.category || "")
      .toLowerCase()
      .trim() ===
    String(found.category || "")
      .toLowerCase()
      .trim()
      ? 1
      : 0;

  // Location = 20%
  const locationSimilarity = calculateLocationSimilarity(
    lost.location,
    found.location
  );

  const score =
    nameSimilarity * 50 +
    categoryMatch * 30 +
    locationSimilarity * 20;

  return Math.round(score);
}


// ===============================
// Get all possible matches
// ===============================
export function getPossibleMatches(reports) {
  if (!Array.isArray(reports)) {
    return [];
  }

  // Active Lost reports
  const lostReports = reports.filter(
    (report) =>
      report.type === "Lost" &&
      report.status !== "Recovered"
  );

  // Active Found reports
  const foundReports = reports.filter(
    (report) =>
      report.type === "Found" &&
      report.status !== "Recovered"
  );

  const matches = [];

  lostReports.forEach((lost) => {
    foundReports.forEach((found) => {

      const score = calculateMatchScore(
        lost,
        found
      );

      // Show only strong possible matches
      if (score >= 60) {
        matches.push({
          lost,
          found,
          score,
        });
      }
    });
  });

  // Highest matches first
  matches.sort(
    (a, b) => b.score - a.score
  );

  return matches;
}