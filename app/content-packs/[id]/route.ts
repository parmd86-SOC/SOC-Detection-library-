import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pack = await prisma.contentPack.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, description: true },
    });

    if (!pack) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // get use_case ids in the pack
    const links = await prisma.contentPackUseCase.findMany({
      where: { content_pack_id: pack.id },
      select: { use_case_id: true },
    });

    const ids = links.map((x) => x.use_case_id);

    const useCases =
      ids.length === 0
        ? []
        : await prisma.useCase.findMany({
            where: { id: { in: ids } },
            orderBy: { updated_at: "desc" },
            select: {
              id: true,
              use_case_code: true,
              title: true,
              description: true,
              priority: true,
              updated_at: true,
            },
          });

    return NextResponse.json({
      ...pack,
      useCases,
    });
  } catch (e) {
    console.error("Failed to fetch content pack:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
