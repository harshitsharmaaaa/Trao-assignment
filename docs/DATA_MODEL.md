# Data Model

## Database Schemas (MongoDB / Mongoose)

### User Document (`users`)
```ts
interface IUser {
  _id: ObjectId;
  email: string; // unique, indexed
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Internal Kit Document (`kits`)
```ts
interface IInternalRequirement {
  id: string; // "r1", "r2"
  text: string;
  kind: "technical" | "behavioural" | "domain";
  priority: "must" | "nice";
}

interface IInternalQuestion {
  id: string; // "q1", "q2"
  requirement_ids: string[];
  category: "technical" | "behavioural" | "system-design" | "company-fit";
  prompt: string;
  answer_outline: string;
  difficulty: number; // 1 | 2 | 3
  user_edited?: boolean;
  is_custom?: boolean;
}

interface IInternalFlashcard {
  id: string; // "f1"
  front: string;
  back: string;
  requirement_ids: string[];
  confidence?: number; // 1-5
  last_reviewed_at?: Date;
  user_edited?: boolean;
}

interface IInternalKit {
  _id: ObjectId;
  kitId: string; // unique GUID or string
  userId: string; // reference to owner
  status: "queued" | "running" | "ok" | "failed";
  progressStage?: string;
  progressMessage?: string;
  error?: { code: string; message: string };
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
    requirements: IInternalRequirement[];
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
```
