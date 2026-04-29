/**
 * Backfill script: generate profile embeddings for all existing users.
 * Run with: npx tsx scratch/backfill_embeddings.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { PrismaClient } from "../prisma/generated";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildProfileText, generateEmbedding, upsertProfileEmbedding } from "../lib/embeddings";

const connectionString = process.env.DIRECT_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to process.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || `User #${user.id}`;
    try {
      const profileText = buildProfileText(user);

      if (profileText.trim().length < 10) {
        console.log(`⏭  Skipping ${name} — profile too sparse`);
        skipped++;
        continue;
      }

      console.log(`🔄 Generating embedding for ${name}...`);
      const embedding = await generateEmbedding(profileText);
      await upsertProfileEmbedding(user.id, embedding, profileText);
      console.log(`✅ ${name} — done (${embedding.length} dims)`);
      success++;
    } catch (err) {
      console.error(`❌ ${name} — failed:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n========== Summary ==========`);
  console.log(`✅ Success: ${success}`);
  console.log(`⏭  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`Total:     ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
