// src/app/api/ai/process-pdf/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

// Use dynamic import to avoid pdf-parse running test file in Next.js build
let pdf;
(async () => {
  pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
})();

export async function POST(request) {
  try {
    const { pdfUrl } = await request.json();
    if (!pdfUrl || typeof pdfUrl !== "string") {
      return NextResponse.json({ error: "No PDF URL provided" }, { status: 400 });
    }

    // Download PDF from URL
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "Failed to download PDF" }, { status: 400 });
    }
    const arrBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrBuffer);

    // Extract text
    const data = await pdf(buffer);
    const text = data.text;
    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "Could not extract text or PDF is too short." },
        { status: 400 }
      );
    }

    // Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Summarization
    const summaryPrompt = `
Summarize the following study notes in 3-5 bullet points:
-----
${text.slice(0, 6000)}
-----`;
    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text();

    // Exam questions
    const pointsPrompt = `
Generate 4-6 possible exam questions based on these notes:
-----
${text.slice(0, 6000)}
-----`;
    const pointsResult = await model.generateContent(pointsPrompt);
    const points = pointsResult.response.text();

    return NextResponse.json({ summary, points });
  } catch (err) {
    console.error("[AI PDF API]", err);
    return NextResponse.json(
      { error: "Server error.", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
