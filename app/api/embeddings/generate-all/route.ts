import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndUpsertEmbedding } from "@/lib/embeddings";

// REGENERATE EMBEDDINGS FOR ALL USERS IN THE DATABASE
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { universityId: { not: null } },
    });

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await generateAndUpsertEmbedding(user);
        success++;
      } catch (e) {
        console.error(`Embedding failed for user ${user.id}:`, e);
        failed++;
      }
    }

    return NextResponse.json({ success, failed, total: users.length });
  } catch (error) {
    console.error("Bulk embedding generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
