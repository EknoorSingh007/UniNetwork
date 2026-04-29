import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET MESSAGES FOR A CONVERSATION
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId } = await context.params;
    const convId = parseInt(conversationId);

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: convId,
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
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const take = 50;

    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { cursor: { id: parseInt(cursor) }, skip: 1 } : {}),
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profile_photo: true },
        },
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: convId,
        senderId: { not: currentUser.id },
        read: false,
      },
      data: { read: true },
    });

    const otherUser = conversation.participants.find(p => p.id !== currentUser.id);

    return NextResponse.json({
      messages: messages.reverse(),
      otherUser,
      currentUserId: currentUser.id,
      hasMore: messages.length === take,
      nextCursor: messages.length === take ? messages[0].id : null,
    });
  } catch (error) {
    console.error("Messages fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// SEND A MESSAGE IN A CONVERSATION
export async function POST(
  req: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId } = await context.params;
    const convId = parseInt(conversationId);
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: convId,
        participants: { some: { id: currentUser.id } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: currentUser.id,
        conversationId: convId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profile_photo: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Message send failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
