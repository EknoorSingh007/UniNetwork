import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateAndUpsertEmbedding } from "@/lib/embeddings";

type Role = "STUDENT" | "ALUMNI";

type OnboardingBody = {
  firstName?: string;
  lastName?: string;
  role?: Role;
  graduationYear?: number;
  domain?: string;
  universityId?: number;
  skills?: string[];
  company?: string | null;
  roleTitle?: string | null;
  openToConnect?: boolean;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isRole(value: unknown): value is Role {
  return value === "STUDENT" || value === "ALUMNI";
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = (await req.json()) as OnboardingBody;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!email) {
    return new Response("Missing Clerk email", { status: 400 });
  }

  const validGraduationYear = typeof body.graduationYear === "number" && Number.isInteger(body.graduationYear);

  if (
    !hasText(body.firstName) ||
    !hasText(body.lastName) ||
    !isRole(body.role) ||
    !validGraduationYear ||
    !hasText(body.domain) ||
    typeof body.universityId !== "number" ||
    !isStringArray(body.skills) ||
    body.skills.length === 0
  ) {
    return new Response("Invalid onboarding payload", { status: 400 });
  }

  const role: Role = body.role;
  const normalizedSkills = Array.from(
    new Set(body.skills.map((item) => item.trim()).filter((item) => item.length > 0)),
  );

  if (normalizedSkills.length === 0) {
    return new Response("Invalid onboarding payload", { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        role,
        graduationYear: body.graduationYear,
        domain: body.domain.trim(),
        universityId: body.universityId,
        skills: normalizedSkills,
        company: hasText(body.company) ? body.company.trim() : null,
        roleTitle: hasText(body.roleTitle) ? body.roleTitle.trim() : null,
        openToConnect: body.openToConnect ?? true,
      },
      create: {
        clerkId: userId,
        email,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        role,
        graduationYear: body.graduationYear,
        domain: body.domain.trim(),
        universityId: body.universityId,
        skills: normalizedSkills,
        company: hasText(body.company) ? body.company.trim() : null,
        roleTitle: hasText(body.roleTitle) ? body.roleTitle.trim() : null,
        openToConnect: body.openToConnect ?? true,
      },
    }),
    prisma.skill.createMany({
      data: normalizedSkills.map((name) => ({ name })),
      skipDuplicates: true,
    }),
  ]);

  // Fire-and-forget: generate profile embedding for similarity search
  prisma.user.findUnique({ where: { clerkId: userId } }).then((dbUser) => {
    if (dbUser) {
      generateAndUpsertEmbedding(dbUser).catch((err) =>
        console.error("Embedding generation failed (onboarding):", err)
      );
    }
  });

  return Response.json({ success: true });
}