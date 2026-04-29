import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      university: true,
    }
  });

  if (!user || !user.domain) {
    redirect("/onboarding");
  }

  return <ProfileClient initialUser={JSON.parse(JSON.stringify(user))} />;
}
