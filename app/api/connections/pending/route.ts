import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET PENDING CONNECTION REQUESTS (SENT AND RECEIVED)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const received = await prisma.connectionRequest.findMany({
      where: { receiverId: currentUser.id, status: "PENDING" },
      include: {
        sender: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sent = await prisma.connectionRequest.findMany({
      where: { senderId: currentUser.id, status: "PENDING" },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roleTitle: true,
            company: true,
            domain: true,
            profile_photo: true,
            role: true,
            clerkId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ received, sent });
  } catch (error) {
    console.error("Pending requests fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
