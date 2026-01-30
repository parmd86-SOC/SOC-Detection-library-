import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pack = await prisma.contentPack.findUnique({
      where: { id: params.id },
      include: {
        content_pack_use_cases: {
          include: { use_case: true },
        },
        content_pack_log_sources: {
          include: { log_source: true },
        },
      },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error("Failed to fetch content pack:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
