import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const universities = await prisma.university.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, domain: true },
    });
    return NextResponse.json(universities);
  } catch (error: any) {
    console.error("Failed to fetch universities:", error);
    return NextResponse.json({ 
        error: "Failed to load universities", 
        details: error.message 
    }, { status: 500 });
  }
}
