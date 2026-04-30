import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { opportunityId, resumeUrl, resumeText } = await req.json();
    if (!opportunityId) return NextResponse.json({ error: "Opportunity ID required" }, { status: 400 });

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: Number(opportunityId) },
    });

    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    // Check if the user is connected to the author or has sent a connection request
    const isConnected = currentUser.connections.includes(opportunity.authorId);
    
    const connectionReq = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: opportunity.authorId },
          { senderId: opportunity.authorId, receiverId: currentUser.id }
        ]
      }
    });

    if (!isConnected && !connectionReq) {
      return NextResponse.json({ error: "You must connect with the author before applying" }, { status: 403 });
    }

    // Check if already applied
    const existing = await prisma.referralRequest.findFirst({
      where: {
        opportunityId: opportunity.id,
        requestorId: currentUser.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already applied" }, { status: 400 });
    }

    const application = await prisma.referralRequest.create({
      data: {
        opportunityId: opportunity.id,
        requestorId: currentUser.id,
        referrerId: opportunity.authorId,
        status: "Pending",
        resumeUrl,
        resumeText,
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Quick apply failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
