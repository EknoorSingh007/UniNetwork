import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const applications = await prisma.referralRequest.findMany({
      where: { requestorId: currentUser.id },
      include: {
        opportunity: {
          include: {
            author: true,
          }
        },
        referrer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Fetch user applications failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
