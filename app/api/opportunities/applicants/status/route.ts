import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the request exists
    const referralRequest = await prisma.referralRequest.findUnique({
      where: { id: parseInt(requestId, 10) },
      include: { opportunity: true },
    });

    if (!referralRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify the current user is the author of the opportunity (the referrer)
    if (referralRequest.referrerId !== currentUser.id) {
      return NextResponse.json({ error: "Unauthorized to update this request" }, { status: 403 });
    }

    // Update status
    const validStatuses = ["Pending", "Reviewed", "Referred", "Not Now"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await prisma.referralRequest.update({
      where: { id: parseInt(requestId, 10) },
      data: { status },
      include: { requestor: true }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update applicant status failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
