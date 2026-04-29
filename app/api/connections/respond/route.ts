import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ACCEPT OR REJECT A CONNECTION REQUEST
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action } = await req.json();
    if (!requestId || !["ACCEPTED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "requestId and action (ACCEPTED|REJECTED) required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (request.receiverId !== currentUser.id) {
      return NextResponse.json({ error: "Not authorized to respond" }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Already responded" }, { status: 409 });
    }

    const updated = await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: action },
    });

    // ADD BOTH USERS TO EACH OTHER'S CONNECTIONS ARRAY ON ACCEPT
    if (action === "ACCEPTED") {
      const sender = await prisma.user.findUnique({ where: { id: request.senderId } });
      if (sender) {
        const senderConns = new Set(sender.connections);
        senderConns.add(currentUser.id);
        await prisma.user.update({
          where: { id: sender.id },
          data: { connections: Array.from(senderConns) },
        });

        const receiverConns = new Set(currentUser.connections);
        receiverConns.add(sender.id);
        await prisma.user.update({
          where: { id: currentUser.id },
          data: { connections: Array.from(receiverConns) },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Connection respond failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
