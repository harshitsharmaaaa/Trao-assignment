import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/client";
import { KitModel } from "@/lib/db/models/Kit";
import { getCurrentUser } from "@/lib/auth/session";
import { toExternalKit } from "@/lib/domain/toExternalKit";
import { generateSchedule } from "@/lib/domain/scheduler";
import { checkCoverage } from "@/lib/domain/coverage";

export const dynamic = 'force-dynamic';


export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const kitDoc = await KitModel.findOne({ kitId: params.id, userId: user.userId });

    if (!kitDoc) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    const kitExternal = kitDoc.status === "ok" ? toExternalKit(kitDoc) : null;

    return NextResponse.json({
      kitId: kitDoc.kitId,
      status: kitDoc.status,
      progress: {
        stage: kitDoc.progressStage,
        message: kitDoc.progressMessage,
      },
      kit: kitExternal,
      internalKit: kitDoc, // Used by builder UI to display internal edit states
      error: kitDoc.error,
      // Additive UI field (Phase 6): lets the schedule tab map day numbers to
      // calendar dates for the "today" treatment. No existing field changed.
      createdAt: kitDoc.createdAt,
    });
  } catch (error: any) {
    console.error("[GET /api/kits/[id] Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch kit", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const kitDoc = await KitModel.findOne({ kitId: params.id, userId: user.userId });
    if (!kitDoc) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    // Apply updates to internal fields (questions, flashcards, brief)
    if (body.company_brief) kitDoc.company_brief = body.company_brief;
    if (body.questions) kitDoc.questions = body.questions;
    if (body.flashcards) kitDoc.flashcards = body.flashcards;
    if (body.role) kitDoc.role = body.role;

    // Recompute schedule and coverage deterministically upon edits
    const updatedSchedule = generateSchedule(
      kitDoc.questions,
      kitDoc.role.requirements,
      kitDoc.daysRequested
    );
    const updatedCoverage = checkCoverage(
      kitDoc.role.requirements,
      kitDoc.questions,
      kitDoc.coverage.passes
    );

    kitDoc.schedule = updatedSchedule;
    kitDoc.coverage = updatedCoverage;

    await kitDoc.save();

    return NextResponse.json({
      message: "Kit updated successfully",
      kit: toExternalKit(kitDoc),
      internalKit: kitDoc,
    });
  } catch (error: any) {
    console.error("[PUT /api/kits/[id] Error]", error);
    return NextResponse.json(
      { error: "Failed to update kit", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const result = await KitModel.deleteOne({ kitId: params.id, userId: user.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Kit deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/kits/[id] Error]", error);
    return NextResponse.json(
      { error: "Failed to delete kit", details: error.message },
      { status: 500 }
    );
  }
}
