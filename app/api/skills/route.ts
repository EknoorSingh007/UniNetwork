import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return Response.json({ skills: [] });
  }

  const rows = await prisma.skill.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: { name: true },
    orderBy: { name: "asc" },
    take: 12,
  });

  return Response.json({
    skills: rows.map((row) => row.name),
  });
}
