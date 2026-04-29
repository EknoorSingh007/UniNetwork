import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// THIRD-PARTY API TO COMPILE LATEX TO PDF
const LATEX_COMPILE_URL = "https://latex.ytotech.com/builds/sync";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { latex } = (await req.json()) as { latex?: string };
        if (!latex?.trim()) {
            return NextResponse.json({ error: "No LaTeX source provided" }, { status: 400 });
        }

        const payload = {
            compiler: "pdflatex",
            resources: [
                {
                    main: true,
                    content: latex,
                },
            ],
        };

        const upstream = await fetch(LATEX_COMPILE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!upstream.ok) {
            const errText = await upstream.text();
            console.error("LaTeX compile error:", errText);
            return NextResponse.json(
                { error: "LaTeX compilation failed. Check your LaTeX source for errors.", detail: errText },
                { status: 422 }
            );
        }

        const pdfBuffer = await upstream.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="resume.pdf"',
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Compile route error:", error);
        return NextResponse.json({ error: "Compilation service unavailable. Please try again." }, { status: 500 });
    }
}