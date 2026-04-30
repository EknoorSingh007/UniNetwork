import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const opportunityId = parseInt(id, 10);

    if (isNaN(opportunityId)) {
      return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    // Verify opportunity exists and belongs to the current user
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    if (opportunity.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Unauthorized access to applicants" }, { status: 403 });
    }

    // Fetch the applicants (referral requests)
    const applicants = await prisma.referralRequest.findMany({
      where: { opportunityId },
      include: {
        requestor: true, // Includes the applicant details
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applicants);
  } catch (error) {
    console.error("Fetch applicants failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
