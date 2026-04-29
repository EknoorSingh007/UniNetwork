import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: Promise<{ postId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await context.params;
  const postId = Number(resolvedParams.postId);

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existingLike = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.like.create({ data: { postId, userId: user.id } });
    return NextResponse.json({ liked: true });
  }
}
