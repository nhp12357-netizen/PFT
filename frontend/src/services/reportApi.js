const API_BASE_URL = "http://127.0.0.1:5000"; // Update if your Flask server is hosted elsewhere

/**
 * Fetch spending report by month and optional account
 * @param {string} month - Format: "YYYY-MM"
 * @param {number} [accountId] - Optional account filter
 * @returns {Promise<Array>} - Array of report objects
 */
export async function fetchReport(month, accountId = null) {
  try {
    let url = `${API_BASE_URL}/api/report?month=${month}`;
    if (accountId) {
      url += `&accountId=${accountId}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch report:", error);
    throw error;
  }
}
