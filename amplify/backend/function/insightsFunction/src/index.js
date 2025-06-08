// amplify/backend/function/insightsFunction/src/index.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const textOnlyModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function formatSummaryForGemini(summary) {
  let prompt = "Analyze the following AWS billing data summary. Provide a **brief, actionable summary** of key cost optimization insights. Focus on **top 3-5 recommendations** only. Use bullet points for recommendations. Keep the overall response **under 200 words**.\n\n";

  prompt += `Overall Billing Period: ${summary.totalOverallCost ? 'Data available' : 'No data'}\n`;
  if (summary.totalOverallCost) {
    prompt += `Total Unblended Cost: $${summary.totalOverallCost}\n\n`;
  }

  if (summary.serviceCosts && summary.serviceCosts.length > 0) {
    prompt += "Top 5 Services by Cost:\n";
    summary.serviceCosts.forEach(([service, cost]) => {
      prompt += `- ${service}: $${cost.toFixed(2)}\n`;
    });
    prompt += "\n";
  }

  if (summary.topExpensiveResources && summary.topExpensiveResources.length > 0) {
    prompt += "Top 5 Expensive Individual Resources:\n";
    summary.topExpensiveResources.forEach(res => {
      prompt += `- Resource ID: ${res.resourceId || 'N/A'}, Service: ${res.service}, Cost: $${res.totalCost.toFixed(2)}, Usage Types: ${res.usageTypes}, Occurrences: ${res.occurrences}, Duration: ${res.durationDays} days\n`;
    });
    prompt += "\n";
  }

  if (summary.idleResources && summary.idleResources.length > 0) {
    prompt += "Potential Idle/Underutilized Resources (Low Cost/Usage):\n";
    summary.idleResources.forEach(res => {
      prompt += `- Resource ID: ${res.resourceId || 'N/A'}, Service: ${res.service}, Cost: $${res.totalCost.toFixed(2)}, Occurrences: ${res.occurrences}, Duration: ${res.durationDays} days\n`;
    });
    prompt += "\n";
  }

  if (summary.dataTruncated) {
    prompt += "Note: The provided data was a sample (first 50,000 rows) due to large file size. Comprehensive analysis might require full dataset processing.\n\n";
  }

  prompt += "Based on this summary, provide the most impactful cost-saving actions, keeping the response concise and under 200 words. Start directly with the summary/recommendations.\n";

  return prompt;
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const csvSummary = body.csvSummary;

    if (!csvSummary || Object.keys(csvSummary).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No CSV summary provided for insights.' })
      };
    }

    const prompt = formatSummaryForGemini(csvSummary);
    console.log("Sending prompt to Gemini (first 500 chars):", prompt.substring(0, 500) + "...");
    console.log("Full prompt length:", prompt.length);

    const result = await textOnlyModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const text = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        insights: text,
        totalOverallCost: csvSummary.totalOverallCost,
        serviceCosts: csvSummary.serviceCosts,
        topExpensiveResources: csvSummary.topExpensiveResources,
        idleResources: csvSummary.idleResources,
        dataTruncated: csvSummary.dataTruncated
      })
    };
  } catch (error) {
    console.error('Error calling Gemini API for insights:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get AI insights from Gemini. Check backend logs for details.', details: error.message })
    };
  }
};
