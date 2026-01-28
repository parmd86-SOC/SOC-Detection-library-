import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logSources = await prisma.logSource.findMany({
      select: {
        id: true,
        name: true,
        // ❌ slug removed (doesn't exist in your schema)
        _count: {
          select: {
            use_cases: true, // keep as-is if this relation name is correct in your schema
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      items: logSources.map((ls) => ({
        id: ls.id,
        name: ls.name,
        useCaseCount: ls._count?.use_cases ?? 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching use-case summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch use-case summary" },
      { status: 500 }
    );
  }
}
