import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProfile = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, universityId: true },
  });

  if (!userProfile?.universityId) {
    return NextResponse.json({ error: "No university assigned" }, { status: 403 });
  }

  const posts = await prisma.post.findMany({
    where: { universityId: userProfile.universityId, published: true },
    include: {
      author: {
        select: { id: true, clerkId: true, firstName: true, lastName: true, roleTitle: true, company: true, domain: true, profile_photo: true },
      },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: userProfile.id },
        select: { id: true },
      },
      comments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { clerkId: true, firstName: true, lastName: true, profile_photo: true, roleTitle: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const formattedPosts = posts.map((post) => ({
    ...post,
    isLiked: post.likes.length > 0,
    likes: undefined, // remove full likes array
  }));

  return NextResponse.json(formattedPosts);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { content, mediaUrls = [] } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, universityId: true },
  });

  if (!user?.universityId) {
    return NextResponse.json({ error: "No university assigned" }, { status: 403 });
  }

  const newPost = await prisma.post.create({
    data: {
      content,
      mediaUrls,
      published: true,
      authorId: user.id,
      universityId: user.universityId,
    },
    include: {
      author: {
        select: { id: true, clerkId: true, firstName: true, lastName: true, roleTitle: true, company: true, domain: true, profile_photo: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json(newPost);
}
