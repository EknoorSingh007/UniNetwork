import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SEND A CONNECTION REQUEST TO ANOTHER USER
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

    const sender = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (sender.id === targetUserId) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
    }

    const existing = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: sender.id },
        ],
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Request already exists", status: existing.status }, { status: 409 });
    }

    const request = await prisma.connectionRequest.create({
      data: {
        senderId: sender.id,
        receiverId: targetUserId,
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error("Connection request failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
