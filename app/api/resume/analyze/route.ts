import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { uploadAndSign } from "@/lib/mistral-upload";

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and resume coach with 15+ years of experience reviewing resumes across tech, finance, consulting, and other industries.

Analyze the resume and return a JSON response with EXACTLY this structure (no markdown, no extra text, pure JSON):

{
  "atsScore": <number 0-100>,
  "summary": "<2-3 sentence overview of the resume strengths and overall quality>",
  "scoreBreakdown": {
    "formatting": <number 0-20>,
    "keywords": <number 0-20>,
    "experience": <number 0-20>,
    "education": <number 0-20>,
    "skills": <number 0-20>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": [
    {
      "issue": "<short title>",
      "description": "<why it hurts ATS/recruiters>",
      "severity": "high" | "medium" | "low"
    }
  ],
  "improvements": [
    {
      "category": "<Keywords | Formatting | Experience | Skills | Summary>",
      "suggestion": "<actionable fix>",
      "example": "<before/after or sample>"
    }
  ],
  "missingKeywords": ["<k1>", "<k2>", "<k3>"],
  "detectedRole": "<role>",
  "experienceLevel": "entry" | "mid" | "senior" | "executive"
}

Be specific, actionable, and honest. Do not sugarcoat issues. Provide real value.`;

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Mistral API key not configured" }, { status: 500 });

    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File | null;

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only PDF and Word documents (.doc, .docx) are supported" }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
        }

        // UPLOAD FILE AND PASS URL
        const { fileId, signedUrl } = await uploadAndSign(file, apiKey);
        const client = new Mistral({ apiKey });

        const response = await client.chat.complete({
            model: "mistral-large-latest",
            responseFormat: { type: "json_object" },
            temperature: 0.3,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "document_url", documentUrl: signedUrl },
                        { type: "text", text: "Analyze this resume and return only valid JSON following the structure in the system prompt." },
                    ],
                },
            ],
        });

        await client.files.delete({ fileId }).catch(() => { });

        const rawText = response.choices?.[0]?.message?.content ?? "";
        const textContent = Array.isArray(rawText)
            ? rawText.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("")
            : rawText;

        const cleaned = textContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let analysis;
        try {
            analysis = JSON.parse(cleaned);
        } catch {
            console.error("Failed to parse Mistral response:", textContent);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error("Resume analysis error:", error);
        return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
    }
}