import { PrismaClient } from "../prisma/generated/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function test() {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Database connection successful. Sample user:", JSON.stringify(users[0], null, 2));
    
    // Check if 'bio' exists in the first user record
    if (users[0] && 'bio' in users[0]) {
      console.log("SUCCESS: 'bio' field is present in the database and Prisma client knows about it.");
    } else {
      console.log("FAILURE: 'bio' field is MISSING from the database or the Prisma client types are wrong.");
    }
  } catch (err) {
    console.error("Database test failed:", err);
  } finally {
    await pool.end();
  }
}

test();
