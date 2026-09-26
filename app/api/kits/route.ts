import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/client";
import { KitModel } from "@/lib/db/models/Kit";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const kits = await KitModel.find({ userId: user.userId })
      .select(
        "kitId status progressStage progressMessage source.company source.role source.company_url daysRequested createdAt coverage role.requirements questions.id questions.category questions.requirement_ids flashcards.id"
      )
      .sort({ createdAt: -1 });

    // Additive UI summary (Phase 6): per-kit counts so the dashboard can show
    // coverage/progress without N+1 detail fetches. No existing field changed.
    const kitsWithSummary = kits.map((k: any) => {
      const requirements: { id: string; priority: string }[] = k.role?.requirements ?? [];
      const mustIds = new Set(requirements.filter((r) => r.priority === "must").map((r) => r.id));
      const uncoveredMust = (k.coverage?.uncovered_requirement_ids ?? []).filter((id: string) =>
        mustIds.has(id)
      );
      return {
        kitId: k.kitId,
        status: k.status,
        progressStage: k.progressStage,
        progressMessage: k.progressMessage,
        source: k.source,
        daysRequested: k.daysRequested,
        createdAt: k.createdAt,
        summary: {
          requirementsTotal: requirements.length,
          mustTotal: mustIds.size,
          mustCovered: mustIds.size - uncoveredMust.length,
          mustUncovered: uncoveredMust.length,
          questionsTotal: (k.questions ?? []).length,
          flashcardsTotal: (k.flashcards ?? []).length,
        },
      };
    });

    return NextResponse.json({ kits: kitsWithSummary });
  } catch (error: any) {
    console.error("[GET /api/kits Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch kits", details: error.message },
      { status: 500 }
    );
  }
}
