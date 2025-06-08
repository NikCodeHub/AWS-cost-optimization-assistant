const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { resourceType, size, region, duration } = body;

  if (!resourceType || !size || !region || !duration) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields for estimation.' }),
    };
  }

  const prompt = `You are an AWS solutions architect and cost estimator.
  Estimate the monthly cost for an AWS ${resourceType} of size ${size} in the ${region} region, running for approximately ${duration} hours/month.
  Provide a high-level estimate in USD. Break it down by key AWS components.
  Format: Start with "Estimated Monthly Cost: $XXX.XX".`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 150 },
    });
    const response = result.response;
    const text = response.text();
    return {
      statusCode: 200,
      body: JSON.stringify({ estimate: text }),
    };
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get cost estimate from Gemini.', details: error.message }),
    };
  }
};
