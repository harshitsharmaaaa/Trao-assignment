import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInternalQuestion {
  id: string;
  requirement_ids: string[];
  category: "technical" | "behavioural" | "system-design" | "company-fit";
  prompt: string;
  answer_outline: string;
  difficulty: number;
  user_edited?: boolean;
  is_custom?: boolean;
}

export interface IInternalFlashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence?: number;
  last_reviewed_at?: Date;
  user_edited?: boolean;
}

export interface IKitDocument extends Document {
  kitId: string;
  userId: string;
  status: "queued" | "running" | "ok" | "failed";
  progressStage?: string;
  progressMessage?: string;
  error?: { code: string; message: string } | null;
  daysRequested: number;
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
    user_edited?: boolean;
  };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Array<{
      id: string;
      text: string;
      kind: "technical" | "behavioural" | "domain";
      priority: "must" | "nice";
    }>;
  };
  questions: IInternalQuestion[];
  flashcards: IInternalFlashcard[];
  schedule: {
    days_available: number;
    days: Array<{
      day: number;
      focus: string;
      question_ids: string[];
      minutes: number;
    }>;
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const KitSchema = new Schema<IKitDocument>(
  {
    kitId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["queued", "running", "ok", "failed"],
      default: "queued",
      required: true,
    },
    progressStage: { type: String, default: "queued" },
    progressMessage: { type: String, default: "Kit queued for generation" },
    error: {
      code: { type: String },
      message: { type: String },
    },
    daysRequested: { type: Number, required: true },
    source: {
      company: { type: String, default: "" },
      company_url: { type: String, default: "" },
      role: { type: String, default: "" },
      location: { type: String, default: "" },
      jd_chars: { type: Number, default: 0 },
      researched_at: { type: String, default: "" },
      pages_used: [{ type: String }],
    },
    company_brief: {
      summary: { type: String, default: "" },
      what_they_do: { type: String, default: "" },
      sources: [{ type: String }],
      user_edited: { type: Boolean, default: false },
    },
    role: {
      title: { type: String, default: "" },
      seniority: { type: String, default: "" },
      responsibilities: [{ type: String }],
      requirements: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          kind: { type: String, enum: ["technical", "behavioural", "domain"], required: true },
          priority: { type: String, enum: ["must", "nice"], required: true },
        },
      ],
    },
    questions: [
      {
        id: { type: String, required: true },
        requirement_ids: [{ type: String }],
        category: {
          type: String,
          enum: ["technical", "behavioural", "system-design", "company-fit"],
          required: true,
        },
        prompt: { type: String, required: true },
        answer_outline: { type: String, default: "" },
        difficulty: { type: Number, required: true, min: 1, max: 3 },
        user_edited: { type: Boolean, default: false },
        is_custom: { type: Boolean, default: false },
      },
    ],
    flashcards: [
      {
        id: { type: String, required: true },
        front: { type: String, required: true },
        back: { type: String, required: true },
        requirement_ids: [{ type: String }],
        confidence: { type: Number, default: 0 },
        last_reviewed_at: { type: Date },
        user_edited: { type: Boolean, default: false },
      },
    ],
    schedule: {
      days_available: { type: Number, required: true },
      days: [
        {
          day: { type: Number, required: true },
          focus: { type: String, default: "" },
          question_ids: [{ type: String }],
          minutes: { type: Number, default: 0 },
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [{ type: String }],
      passes: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const KitModel: Model<IKitDocument> =
  mongoose.models.Kit || mongoose.model<IKitDocument>("Kit", KitSchema);
