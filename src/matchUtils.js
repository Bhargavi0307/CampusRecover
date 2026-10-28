const SBERT_API_URL = "http://127.0.0.1:5000/similarity";
const MATCH_THRESHOLD = 60;

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

// ===============================
// ITEM GROUPS
// ===============================
const itemGroups = {
  jewelry: [
    "earring", "earrings", "ring", "finger ring",
    "necklace", "chain", "bracelet", "bangle",
    "jewellery", "jewelry",
  ],
  electronics: [
    "phone", "mobile", "smartphone", "iphone",
    "android", "laptop", "computer", "tablet",
    "ipad", "airpods", "earphone", "earphones",
    "earbud", "earbuds", "headphone", "headphones",
    "charger", "watch", "smartwatch",
  ],
  stationery: [
    "pen", "pencil", "notebook", "book",
    "bag", "pouch", "calculator",
  ],
  idCards: [
    "id card", "identity card", "college id",
    "student id", "card", "aadhar", "aadhaar",
    "license",
  ],
  keys: ["key", "keys", "keychain"],
  personalItems: [
    "wallet", "purse", "spectacles", "glasses",
    "umbrella", "bottle", "water bottle", "watch",
  ],
  money: [
    "money", "cash", "rupees", "rupee",
    "notes", "currency",
  ],
};

// ===============================
// GET ITEM GROUP
// ===============================
function getItemGroup(itemName) {
  const text = normalizeText(itemName);

  for (const [group, keywords] of Object.entries(itemGroups)) {
    if (
      keywords.some((keyword) => {
        const normalizedKeyword = normalizeText(keyword);

        return (
          text === normalizedKeyword ||
          text.includes(normalizedKeyword)
        );
      })
    ) {
      return group;
    }
  }

  return null;
}

// ===============================
// SPECIFIC ITEM COMPATIBILITY
// ===============================
function getSpecificItemType(itemName) {
  const text = normalizeText(itemName);

  const itemTypes = {
    earphones: [
      "earphone", "earphones", "earbud",
      "earbuds", "headphone", "headphones",
      "airpods",
    ],
    tablets: ["ipad", "tablet"],
    phones: ["phone", "mobile", "smartphone", "iphone", "android"],
    laptops: ["laptop", "notebook computer"],
    wallets: ["wallet", "purse"],
    bottles: ["water bottle", "bottle"],
    keys: ["keychain", "keys", "key"],
    rings: ["finger ring", "ring"],
    earrings: ["earrings", "earring"],
  };

  for (const [type, keywords] of Object.entries(itemTypes)) {
    if (
      keywords.some((keyword) => {
        const normalizedKeyword = normalizeText(keyword);

        return (
          text === normalizedKeyword ||
          text.includes(normalizedKeyword)
        );
      })
    ) {
      return type;
    }
  }

  return null;
}

// ===============================
// OLD NAME SIMILARITY
// Kept as baseline
// ===============================
export function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const a = normalizeText(name1);
  const b = normalizeText(name2);

  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) return 0.85;

  const groupA = getItemGroup(a);
  const groupB = getItemGroup(b);

  if (groupA && groupA === groupB) return 0.75;

  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  const commonWords = wordsA.filter((word) =>
    wordsB.includes(word)
  );

  if (commonWords.length > 0) {
    return commonWords.length /
      Math.max(wordsA.length, wordsB.length);
  }

  return 0;
}

// ===============================
// LOCATION SIMILARITY
// ===============================
export function calculateLocationSimilarity(location1, location2) {
  if (!location1 || !location2) return 0;

  const a = normalizeText(location1);
  const b = normalizeText(location2);

  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) return 0.8;

  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  const commonWords = wordsA.filter((word) =>
    wordsB.includes(word)
  );

  if (commonWords.length > 0) {
    return commonWords.length /
      Math.max(wordsA.length, wordsB.length);
  }

  return 0;
}

// ===============================
// CATEGORY SIMILARITY
// ===============================
export function calculateCategorySimilarity(category1, category2) {
  if (!category1 || !category2) return 0;

  return normalizeText(category1) === normalizeText(category2)
    ? 1
    : 0;
}

// ===============================
// SBERT SEMANTIC SIMILARITY
// Flask API: POST /similarity
// ===============================
export async function calculateSBERTSimilarity(textA, textB) {
  if (
    typeof textA !== "string" ||
    typeof textB !== "string" ||
    !textA.trim() ||
    !textB.trim()
  ) {
    return null;
  }

  try {
    const response = await fetch(SBERT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text_a: textA,
        text_b: textB,
      }),
    });

    if (!response.ok) {
      throw new Error(`SBERT API returned ${response.status}`);
    }

    const data = await response.json();

    if (typeof data.score !== "number") {
      throw new Error("Invalid SBERT API response");
    }

    return data.score;
  } catch (error) {
    console.error("SBERT API request failed:", error);
    return null;
  }
}

// ===============================
// OLD MATCH SCORE
// Baseline: name 50%, category 30%, location 20%
// ===============================
export function calculateMatchScore(lost, found) {
  if (!lost || !found) return 0;

  const nameSimilarity = calculateNameSimilarity(
    lost.itemName,
    found.itemName
  );

  const categorySimilarity = calculateCategorySimilarity(
    lost.category,
    found.category
  );

  const locationSimilarity = calculateLocationSimilarity(
    lost.location,
    found.location
  );

  return Math.round(
    nameSimilarity * 50 +
    categorySimilarity * 30 +
    locationSimilarity * 20
  );
}

// ===============================
// BUILD DESCRIPTION FOR SBERT
// Include available report details
// ===============================
function buildItemText(report) {
  const parts = [
    report.itemName,
    report.description,
    report.category,
    report.color,
    report.brand,
  ];

  return parts
    .filter((value) => typeof value === "string" && value.trim())
    .join(". ");
}

// ===============================
// NEW SBERT MATCH SCORE
// Name/description 50%, category 30%, location 20%
// ===============================
export async function calculateSBERTMatchScore(lost, found) {
  if (!lost || !found) {
    return {
      score: 0,
      sbertSimilarity: null,
      usedFallback: true,
    };
  }

  // Reject clearly different known item groups.
  const lostGroup = getItemGroup(lost.itemName);
  const foundGroup = getItemGroup(found.itemName);

  if (
    lostGroup &&
    foundGroup &&
    lostGroup !== foundGroup
  ) {
    return {
      score: 0,
      sbertSimilarity: null,
      usedFallback: false,
    };
  }

  // Reject different specific item types.
  // Example: earphone vs iPad.
  // Synonyms such as earphone vs headphones remain compatible.
  const lostSpecificType = getSpecificItemType(lost.itemName);
  const foundSpecificType = getSpecificItemType(found.itemName);

  if (
    lostSpecificType &&
    foundSpecificType &&
    lostSpecificType !== foundSpecificType
  ) {
    console.log("SPECIFIC ITEM TYPE MISMATCH:", {
      lostItem: lost.itemName,
      foundItem: found.itemName,
      lostSpecificType,
      foundSpecificType,
    });

    return {
      score: 0,
      sbertSimilarity: null,
      usedFallback: false,
    };
  }

  const baselineScore = calculateMatchScore(lost, found);

  const lostText = buildItemText(lost);
  const foundText = buildItemText(found);

  const sbertSimilarity = await calculateSBERTSimilarity(
    lostText,
    foundText
  );

  // If API is unavailable, keep the existing matching functional.
  if (sbertSimilarity === null) {
    return {
      score: baselineScore,
      sbertSimilarity: null,
      usedFallback: true,
    };
  }

  const categorySimilarity = calculateCategorySimilarity(
    lost.category,
    found.category
  );

  const locationSimilarity = calculateLocationSimilarity(
    lost.location,
    found.location
  );

  // SBERT cosine similarity is not a probability.
  // Map it to a bounded 0–1 value for this initial prototype.
  const semanticSimilarity = Math.max(
    0,
    Math.min(1, sbertSimilarity)
  );

  const score = Math.round(
    semanticSimilarity * 50 +
    categorySimilarity * 30 +
    locationSimilarity * 20
  );

  console.log("SBERT MATCH DEBUG:", {
    lostItem: lost.itemName,
    foundItem: found.itemName,
    lostSpecificType,
    foundSpecificType,
    sbertSimilarity,
    categorySimilarity,
    locationSimilarity,
    baselineScore,
    finalScore: score,
    usedFallback: false,
  });

  return {
    score,
    sbertSimilarity,
    usedFallback: false,
  };
}

// ===============================
// GET POSSIBLE MATCHES
// Now asynchronous because SBERT uses fetch()
// ===============================
export async function getPossibleMatches(reports) {
  if (!Array.isArray(reports)) return [];

  const lostReports = reports.filter(
    (report) =>
      report.type === "Lost" &&
      report.status !== "Recovered"
  );

  const foundReports = reports.filter(
    (report) =>
      report.type === "Found" &&
      report.status !== "Recovered"
  );

  const matches = [];

  // Score every Lost/Found pair through SBERT.
  for (const lost of lostReports) {
    for (const found of foundReports) {
      const result = await calculateSBERTMatchScore(lost, found);
      const score = result.score;

      console.log("MATCH CHECK:", {
        lostId: lost.id,
        foundId: found.id,
        lostItem: lost.itemName,
        foundItem: found.itemName,
        score,
        sbertSimilarity: result.sbertSimilarity,
        usedFallback: result.usedFallback,
      });

      if (score >= MATCH_THRESHOLD) {
        matches.push({
          lost: {
            ...lost,
            reportKey: `lost-${lost.id}`,
          },
          found: {
            ...found,
            reportKey: `found-${found.id}`,
          },

          finderEmail: found.userEmail || "",
          finderName: found.userName || "Finder",
          finderUserId: found.userId || "",

          lostUserEmail: lost.userEmail || "",
          lostUserName: lost.userName || "Student",
          lostUserId: lost.userId || "",

          score,
          sbertSimilarity: result.sbertSimilarity,
          usedFallback: result.usedFallback,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  console.log("FINAL POSSIBLE MATCHES:", matches);

  return matches;
}