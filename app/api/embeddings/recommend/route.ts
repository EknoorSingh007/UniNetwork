import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findSimilarProfiles } from "@/lib/embeddings";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find similar profiles via pgvector cosine similarity
    const matches = await findSimilarProfiles(user.id, 5);

    if (matches.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Fetch full user data for matched profiles
    const matchedUserIds = matches.map((m) => m.user_id);
    const recommendedUsers = await prisma.user.findMany({
      where: { id: { in: matchedUserIds } },
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
        openToMentor: true,
        clerkId: true,
      },
    });

    // Merge similarity scores and sort by similarity
    const recommendations = recommendedUsers
      .map((u) => {
        const match = matches.find((m) => m.user_id === u.id);
        return {
          ...u,
          similarity: match?.similarity ?? 0,
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommendation fetch failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
