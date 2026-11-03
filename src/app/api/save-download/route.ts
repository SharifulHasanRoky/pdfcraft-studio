import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/**
 * POST /api/save-download
 * Body: raw bytes of a file.
 * Headers: X-Filename: <name>, Content-Type: <mime>
 * Saves a copy to /home/z/my-project/download/ for the sandbox preview deliverable.
 */
export async function POST(req: NextRequest) {
  try {
    const filename = req.headers.get("X-Filename") || `file-${Date.now()}`;
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = "/home/z/my-project/download";
    await mkdir(dir, { recursive: true });
    const buf = await req.arrayBuffer();
    await writeFile(path.join(dir, safe), Buffer.from(buf));
    return NextResponse.json({ ok: true, path: `/download/${safe}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
