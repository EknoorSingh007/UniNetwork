import { Mistral } from "@mistralai/mistralai";

/**
 * Uploads a file to Mistral's Files API using raw fetch (bypasses the SDK's
 * broken multipart serialization) and returns the file ID + a signed URL.
 */
export async function uploadAndSign(
    file: File,
    apiKey: string
): Promise<{ fileId: string; signedUrl: string }> {
    // Build multipart form the same way the browser would
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("purpose", "ocr");

    const uploadRes = await fetch("https://api.mistral.ai/v1/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    });

    if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Mistral file upload failed (${uploadRes.status}): ${text}`);
    }

    const uploaded = await uploadRes.json() as { id: string };

    const client = new Mistral({ apiKey });
    const { url: signedUrl } = await client.files.getSignedUrl({ fileId: uploaded.id });

    return { fileId: uploaded.id, signedUrl };
}