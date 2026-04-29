import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL CONVERSATIONS FOR CURRENT USER
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: currentUser.id } },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile_photo: true,
            clerkId: true,
            roleTitle: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formatted = conversations.map(c => {
      const otherUser = c.participants.find(p => p.id !== currentUser.id);
      const lastMessage = c.messages[0] || null;
      return {
        id: c.id,
        otherUser,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.firstName,
          read: lastMessage.read,
        } : null,
        lastMessageAt: c.lastMessageAt,
      };
    });

    return NextResponse.json({ conversations: formatted, currentUserId: currentUser.id });
  } catch (error) {
    console.error("Conversations fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// CREATE OR GET EXISTING CONVERSATION BETWEEN TWO CONNECTED USERS
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!currentUser.connections.includes(targetUserId)) {
      return NextResponse.json({ error: "Must be connected to chat" }, { status: 403 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: currentUser.id } } },
          { participants: { some: { id: targetUserId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: currentUser.id }, { id: targetUserId }],
        },
      },
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Conversation create failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
