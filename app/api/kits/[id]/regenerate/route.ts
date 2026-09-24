import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/client";
import { KitModel } from "@/lib/db/models/Kit";
import { getCurrentUser } from "@/lib/auth/session";
import { generateStructuredJson } from "@/lib/llm/client";
import { mergeCategoryRegeneration, mergeCompanyBriefRegeneration } from "@/lib/domain/merger";
import { generateSchedule } from "@/lib/domain/scheduler";
import { checkCoverage } from "@/lib/domain/coverage";
import { toExternalKit } from "@/lib/domain/toExternalKit";

const RegenerateSchema = z.object({
  section: z.enum([
    "company_brief",
    "schedule",
    "technical",
    "behavioural",
    "system-design",
    "company-fit",
  ]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RegenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const { section } = parsed.data;
    await connectToDatabase();

    const kitDoc = await KitModel.findOne({ kitId: params.id, userId: user.userId });
    if (!kitDoc) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    if (section === "company_brief") {
      const briefSchema = z.object({
        summary: z.string(),
        what_they_do: z.string(),
        sources: z.array(z.string()),
      });

      const newBrief = await generateStructuredJson(
        `Regenerate company brief summary and what they do for ${kitDoc.source.company || "the company"}. Return ONLY a single JSON object (no wrapper, no markdown) with EXACTLY these keys: "summary" (string), "what_they_do" (string), "sources" (array of strings). Do not add, rename, or omit any key.`,
        "Regenerate concise company information.",
        briefSchema
      );

      kitDoc.company_brief = mergeCompanyBriefRegeneration(kitDoc.company_brief, newBrief);
    } else if (section === "schedule") {
      kitDoc.schedule = generateSchedule(
        kitDoc.questions,
        kitDoc.role.requirements,
        kitDoc.daysRequested
      );
    } else {
      // Question category regeneration (technical, behavioural, system-design, company-fit)
      const categoryQuestionsSchema = z.array(
        z.object({
          requirement_id: z.string().optional(),
          category: z.enum(["technical", "behavioural", "system-design", "company-fit"]),
          prompt: z.string(),
          answer_outline: z.string(),
          difficulty: z.number().int().min(1).max(3),
        })
      );

      const rawNewQuestions = await generateStructuredJson(
        `Regenerate questions specifically for category '${section}' for role ${kitDoc.role.title || "Engineer"}. Return ONLY a bare JSON array (no wrapper object, no markdown). Each element MUST be an object with EXACTLY these keys: "requirement_id" (string), "category" (always "${section}"), "prompt" (string), "answer_outline" (string), "difficulty" (integer 1-3). Do not add, rename, or omit any key.`,
        "Generate realistic interview questions for the specified category.",
        categoryQuestionsSchema
      );

      const formattedNewQuestions = rawNewQuestions.map((q, idx) => ({
        id: `q_${section}_${Date.now()}_${idx}`,
        requirement_ids: [q.requirement_id || kitDoc.role.requirements[0]?.id || "r1"],
        category: section as any,
        prompt: q.prompt,
        answer_outline: q.answer_outline,
        difficulty: q.difficulty,
      }));

      const mergedQuestions = mergeCategoryRegeneration(
        kitDoc.questions,
        formattedNewQuestions,
        section
      );

      kitDoc.questions = mergedQuestions;
    }

    // Recompute schedule & coverage after section regeneration
    kitDoc.schedule = generateSchedule(
      kitDoc.questions,
      kitDoc.role.requirements,
      kitDoc.daysRequested
    );
    kitDoc.coverage = checkCoverage(
      kitDoc.role.requirements,
      kitDoc.questions,
      kitDoc.coverage.passes
    );

    await kitDoc.save();

    return NextResponse.json({
      message: `Section '${section}' regenerated successfully`,
      kit: toExternalKit(kitDoc),
      internalKit: kitDoc,
    });
  } catch (error: any) {
    console.error("[POST /api/kits/[id]/regenerate Error]", error);
    return NextResponse.json(
      { error: "Regeneration failed", details: error.message },
      { status: 500 }
    );
  }
}
