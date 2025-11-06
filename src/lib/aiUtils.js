import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getSummaryAndPoints(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const summaryPrompt = `Summarize the following document for students:\n${text}`;
  const summaryResult = await model.generateContent([summaryPrompt]);
  const summary = summaryResult.response.text();

  const pointsPrompt = `Extract the key points and possible exam questions from the following document:\n${text}`;
  const pointsResult = await model.generateContent([pointsPrompt]);
  const points = pointsResult.response.text();

  return { summary, points };
}
