import { prisma } from "./lib/prisma";

async function check() {
  try {
    const count = await prisma.university.count();
    console.log(`University count: ${count}`);
    const first = await prisma.university.findFirst();
    console.log(`First university:`, first);
  } catch (e) {
    console.error("Database check failed:", e);
  }
}

check();
