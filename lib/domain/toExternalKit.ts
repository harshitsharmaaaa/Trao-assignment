import { Kit } from "@/schemas/kit.schema";
import { IKitDocument } from "@/lib/db/models/Kit";

export function toExternalKit(internalKit: IKitDocument | Record<string, any>): Kit {
  return {
    source: {
      company: internalKit.source?.company || "",
      company_url: internalKit.source?.company_url || "",
      role: internalKit.source?.role || "",
      location: internalKit.source?.location || "",
      jd_chars: internalKit.source?.jd_chars || 0,
      researched_at: internalKit.source?.researched_at || new Date().toISOString(),
      pages_used: internalKit.source?.pages_used || [],
    },
    company_brief: {
      summary: internalKit.company_brief?.summary || "",
      what_they_do: internalKit.company_brief?.what_they_do || "",
      sources: internalKit.company_brief?.sources || [],
    },
    role: {
      title: internalKit.role?.title || "",
      seniority: internalKit.role?.seniority || "",
      responsibilities: internalKit.role?.responsibilities || [],
      requirements: (internalKit.role?.requirements || []).map((req: any) => ({
        id: req.id,
        text: req.text,
        kind: req.kind,
        priority: req.priority,
      })),
    },
    questions: (internalKit.questions || []).map((q: any) => ({
      id: q.id,
      requirement_ids: q.requirement_ids || [],
      category: q.category,
      prompt: q.prompt,
      answer_outline: q.answer_outline || "",
      difficulty: q.difficulty,
    })),
    flashcards: (internalKit.flashcards || []).map((f: any) => ({
      id: f.id,
      front: f.front,
      back: f.back,
      requirement_ids: f.requirement_ids || [],
    })),
    schedule: {
      days_available: internalKit.schedule?.days_available || internalKit.daysRequested || 1,
      days: (internalKit.schedule?.days || []).map((d: any) => ({
        day: d.day,
        focus: d.focus || "",
        question_ids: d.question_ids || [],
        minutes: d.minutes || 0,
      })),
    },
    coverage: {
      uncovered_requirement_ids: internalKit.coverage?.uncovered_requirement_ids || [],
      passes: internalKit.coverage?.passes || 0,
    },
  };
}
