import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are an expert career advisor.
Your goal is to generate a concise, tailored cover letter/resume summary (max 150 words) for a candidate applying to an opportunity.
Use the provided user profile data and the opportunity description to highlight why the candidate is a strong fit.
Return ONLY the text of the cover letter. Do not include salutations or closing remarks, just the core content.`;

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Mistral API key not configured" }, { status: 500 });

    try {
        const { opportunityId } = await req.json();

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

        const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
        if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

        const userContext = [
            `Name: ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            user.role ? `Role: ${user.role}` : null,
            user.graduationYear ? `Graduation Year: ${user.graduationYear}` : null,
            user.domain ? `Primary Domain: ${user.domain}` : null,
            user.company ? `Current Company: ${user.company}` : null,
            user.roleTitle ? `Current Title: ${user.roleTitle}` : null,
            user.skills?.length ? `Skills: ${user.skills.join(", ")}` : null,
            user.bio ? `Bio: ${user.bio}` : null,
        ].filter(Boolean).join("\n");

        const oppContext = [
            `Title: ${opportunity.title}`,
            `Type: ${opportunity.type}`,
            `Description: ${opportunity.description}`,
            opportunity.skills?.length ? `Required Skills: ${opportunity.skills.join(", ")}` : null,
        ].filter(Boolean).join("\n");

        const client = new Mistral({ apiKey });

        const completion = await client.chat.complete({
            model: "mistral-large-latest",
            temperature: 0.5,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { 
                  role: "user", 
                  content: `Generate a tailored summary for this candidate applying to this opportunity.\n\n=== CANDIDATE PROFILE ===\n${userContext}\n\n=== OPPORTUNITY ===\n${oppContext}` 
                },
            ],
        });

        const generatedText = (completion.choices?.[0]?.message?.content as string) ?? "";

        return NextResponse.json({ success: true, text: generatedText.trim() });
    } catch (error) {
        console.error("Resume generation error:", error);
        return NextResponse.json({ error: "Failed to generate text. Please try again." }, { status: 500 });
    }
}
