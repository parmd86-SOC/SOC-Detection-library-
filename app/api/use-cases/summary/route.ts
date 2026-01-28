import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // log source tiles: count of use cases per log source
    const logSources = await prisma.logSource.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            use_cases: true, // assumes relation name is use_cases on LogSource
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // mitre dropdown options: count of use cases per technique
    const mitre = await prisma.mitreTechnique.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            use_cases: true, // assumes relation name is use_cases on MitreTechnique
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      logSources: logSources.map((ls) => ({
        id: ls.id,
        name: ls.name,
        slug: ls.slug,
        useCaseCount: ls._count.use_cases,
      })),
      mitre: mitre.map((t) => ({
        id: t.id,
        name: t.name,
        useCaseCount: t._count.use_cases,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
