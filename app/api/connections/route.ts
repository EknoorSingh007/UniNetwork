import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL CONNECTIONS FOR CURRENT USER
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (currentUser.connections.length === 0) {
      return NextResponse.json({ connections: [] });
    }

    const connections = await prisma.user.findMany({
      where: { id: { in: currentUser.connections } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roleTitle: true,
        company: true,
        domain: true,
        skills: true,
        profile_photo: true,
        role: true,
        clerkId: true,
        openToMentor: true,
      },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Connections fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// REMOVE A CONNECTION BETWEEN TWO USERS
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return NextResponse.json({ error: "Target not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { connections: currentUser.connections.filter(id => id !== targetUserId) },
    });

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { connections: targetUser.connections.filter(id => id !== currentUser.id) },
    });

    await prisma.connectionRequest.updateMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUser.id },
        ],
        status: "ACCEPTED",
      },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connection delete failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
