export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ revision: process.env.VERCEL_GIT_COMMIT_SHA || null }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
