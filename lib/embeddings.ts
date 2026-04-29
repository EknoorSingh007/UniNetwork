import { Mistral } from "@mistralai/mistralai";
import pg from "pg";

// Lazy singletons — initialized on first use so env vars are available
let _mistral: Mistral | null = null;
function getMistral() {
  if (!_mistral) {
    _mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
  }
  return _mistral;
}

let _pool: pg.Pool | null = null;
function getPool() {
  if (!_pool) {
    _pool = new pg.Pool({
      connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
    });
  }
  return _pool;
}

/**
 * Build a text representation of a user profile suitable for embedding.
 */
export function buildProfileText(user: {
  role: string;
  domain?: string | null;
  skills: string[];
  bio?: string | null;
  company?: string | null;
  roleTitle?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  graduationYear?: number | null;
}): string {
  const parts: string[] = [];

  // Emphasize tech stack and domain, but keep it clean so we don't dilute exact matches with noise
  if (user.skills.length > 0) {
    parts.push(`[SKILLS] ${user.skills.join(", ")}`);
  }
  
  if (user.domain) {
    parts.push(`[DOMAIN] ${user.domain}`);
  }

  // Add lower-priority context
  if (user.roleTitle) parts.push(`[TITLE] ${user.roleTitle}`);
  parts.push(`[ROLE] ${user.role}`);
  
  if (user.company) parts.push(`[COMPANY] ${user.company}`);
  if (user.graduationYear) parts.push(`[YEAR] ${user.graduationYear}`);
  
  // Keep bio at the end
  if (user.bio) parts.push(`[BIO] ${user.bio}`);

  return parts.join("\n");
}

/**
 * Generate an embedding vector using Mistral's mistral-embed model (1024 dims).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getMistral().embeddings.create({
    model: "mistral-embed",
    inputs: [text],
  });

  const data = response.data;
  if (!data || data.length === 0 || !data[0].embedding) {
    throw new Error("Mistral embedding response has no data");
  }

  return data[0].embedding;
}

/**
 * Upsert a user's profile embedding into the profile_embeddings table.
 */
export async function upsertProfileEmbedding(
  userId: number,
  embedding: number[],
  profileText: string
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;

  await getPool().query(
    `INSERT INTO profile_embeddings (user_id, embedding, profile_text, updated_at)
     VALUES ($1, $2::vector, $3, now())
     ON CONFLICT (user_id) DO UPDATE SET
       embedding = EXCLUDED.embedding,
       profile_text = EXCLUDED.profile_text,
       updated_at = now()`,
    [userId, vectorStr, profileText]
  );
}

/**
 * Find similar profiles using cosine similarity via pgvector match_profiles function.
 */
export async function findSimilarProfiles(
  userId: number,
  limit: number = 5
): Promise<{ user_id: number; similarity: number }[]> {
  // First get the current user's embedding
  const embResult = await getPool().query(
    `SELECT embedding FROM profile_embeddings WHERE user_id = $1`,
    [userId]
  );

  if (embResult.rows.length === 0) {
    return [];
  }

  const result = await getPool().query(
    `SELECT * FROM match_profiles($1::vector, $2, $3)`,
    [embResult.rows[0].embedding, limit, userId]
  );

  return result.rows;
}

/**
 * Generate and upsert a profile embedding for a user (convenience wrapper).
 */
export async function generateAndUpsertEmbedding(user: {
  id: number;
  role: string;
  domain?: string | null;
  skills: string[];
  bio?: string | null;
  company?: string | null;
  roleTitle?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  graduationYear?: number | null;
}): Promise<void> {
  const profileText = buildProfileText(user);
  const embedding = await generateEmbedding(profileText);
  await upsertProfileEmbedding(user.id, embedding, profileText);
}
