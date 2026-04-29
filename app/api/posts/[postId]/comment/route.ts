import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: { params: Promise<{ postId: string }> }) {
  const resolvedParams = await context.params;
  const postId = Number(resolvedParams.postId);

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      user: { select: { clerkId: true, firstName: true, lastName: true, profile_photo: true, roleTitle: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, context: { params: Promise<{ postId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await context.params;
  const postId = Number(resolvedParams.postId);
  
  const body = await req.json();
  const { content } = body;
  
  if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const comment = await prisma.comment.create({ 
      data: { postId, userId: user.id, content },
      include: {
          user: { select: { clerkId: true, firstName: true, lastName: true, profile_photo: true } }
      }
  });
  
  return NextResponse.json(comment);
}
