import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/client";
import { KitModel } from "@/lib/db/models/Kit";
import { getCurrentUser } from "@/lib/auth/session";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { toExternalKit } from "@/lib/domain/toExternalKit";

const GenerateKitSchema = z.object({
  jd: z.string().min(10, "Job description must be at least 10 characters"),
  company_url: z.string().url("Invalid company URL"),
  days: z.number().int().min(1).max(60),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = GenerateKitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { jd, company_url, days } = parsed.data;
    await connectToDatabase();

    const kitId = `kit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create queued Kit record
    const kitDoc = await KitModel.create({
      kitId,
      userId: user.userId,
      status: "running",
      progressStage: "retrieval",
      progressMessage: "Crawling company website and parsing job description",
      daysRequested: days,
      schedule: { days_available: days, days: [] },
      coverage: { uncovered_requirement_ids: [], passes: 0 },
      source: {
        company: "",
        company_url,
        role: "",
        location: "",
        jd_chars: jd.length,
        researched_at: new Date().toISOString(),
        pages_used: [],
      },
    });

    // Run pipeline asynchronously or synchronously in memory
    runPipeline(
      { jd, company_url, days },
      {
        onProgress: async (stage, message) => {
          await KitModel.updateOne({ kitId }, { progressStage: stage, progressMessage: message });
        },
      }
    ).then(async (result) => {
      if (result.status === "ok" && result.kit) {
        await KitModel.updateOne(
          { kitId },
          {
            status: "ok",
            progressStage: "complete",
            progressMessage: "Kit generation completed",
            source: result.kit.source,
            company_brief: result.kit.company_brief,
            role: result.kit.role,
            questions: result.kit.questions,
            flashcards: result.kit.flashcards,
            schedule: result.kit.schedule,
            coverage: result.kit.coverage,
          }
        );
      } else {
        await KitModel.updateOne(
          { kitId },
          {
            status: "failed",
            progressStage: "failed",
            progressMessage: result.error?.message || "Generation failed",
            error: result.error || { code: "UNKNOWN_ERROR", message: "Generation failed" },
          }
        );
      }
    }).catch(async (err) => {
      await KitModel.updateOne(
        { kitId },
        {
          status: "failed",
          progressStage: "failed",
          progressMessage: err.message || "Fatal error during generation",
          error: { code: "FATAL_ERROR", message: err.message },
        }
      );
    });

    return NextResponse.json(
      { kitId, status: "running", message: "Kit generation started" },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[POST /api/kits/generate Error]", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
