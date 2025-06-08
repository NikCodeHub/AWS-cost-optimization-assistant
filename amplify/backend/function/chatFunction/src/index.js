const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { userQuestion, csvContext } = body;

  if (!userQuestion || !csvContext) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: userQuestion or csvContext.' }),
    };
  }

  const chatPrompt = `You are an expert AWS cost optimization assistant.
  Billing Summary:
  Total Cost: ${csvContext.totalOverallCost || 'N/A'}
  Top Services: ${csvContext.topServices || 'N/A'}
  Rows Processed: ${csvContext.numRowsProcessed}
  ${csvContext.dataTruncated ? 'Note: Partial data only.' : ''}

  User question:
  "${userQuestion}"

  Answer based on the above. Keep it short and focused on cost optimization.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: chatPrompt }] }],
      generationConfig: { maxOutputTokens: 250 },
    });
    const response = result.response;
    const text = response.text();
    return {
      statusCode: 200,
      body: JSON.stringify({ answer: text }),
    };
  } catch (error) {
    console.error("Gemini chat error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get chat response.', details: error.message }),
    };
  }
};