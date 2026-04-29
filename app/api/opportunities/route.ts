import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { universityId: true }
    });

    if (!user?.universityId) return NextResponse.json({ error: "University not found" }, { status: 404 });

    const opportunities = await prisma.opportunity.findMany({
      where: { universityId: user.universityId },
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Fetch opportunities failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !user.universityId) {
      return NextResponse.json({ error: "User or university not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, type, description, skills, salary, location, outcomes, applicationLink, deadline } = body;

    if (!title || !type || !description) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        type,
        description,
        skills: Array.isArray(skills) ? skills : [],
        salary,
        location,
        outcomes,
        applicationLink,
        deadline: deadline ? new Date(deadline) : null,
        authorId: user.id,
        universityId: user.universityId,
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Post opportunity failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
