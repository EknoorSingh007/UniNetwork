import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// CHECK CONNECTION STATUS BETWEEN CURRENT USER AND TARGET
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get("targetId");
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const targetUserId = parseInt(targetId);

    if (currentUser.connections.includes(targetUserId)) {
      return NextResponse.json({ status: "CONNECTED" });
    }

    const pending = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUser.id },
        ],
        status: "PENDING",
      },
    });

    if (pending) {
      const direction = pending.senderId === currentUser.id ? "SENT" : "RECEIVED";
      return NextResponse.json({ status: "PENDING", direction, requestId: pending.id });
    }

    return NextResponse.json({ status: "NONE" });
  } catch (error) {
    console.error("Connection status check failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
