import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/client";
import { KitModel } from "@/lib/db/models/Kit";
import { getCurrentUser } from "@/lib/auth/session";

const RateCardSchema = z.object({
  flashcardId: z.string(),
  confidence: z.number().int().min(1).max(5),
});

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

    // Sort flashcards so cards with lower confidence ratings are prioritized first
    const sortedCards = [...kitDoc.flashcards].sort((a, b) => {
      const confA = a.confidence ?? 0;
      const confB = b.confidence ?? 0;
      return confA - confB; // Lowest confidence first
    });

    return NextResponse.json({ flashcards: sortedCards });
  } catch (error: any) {
    console.error("[GET /api/kits/[id]/practice Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch practice cards", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating body" }, { status: 400 });
    }

    const { flashcardId, confidence } = parsed.data;
    await connectToDatabase();

    const kitDoc = await KitModel.findOne({ kitId: params.id, userId: user.userId });
    if (!kitDoc) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    const card = kitDoc.flashcards.find((f) => f.id === flashcardId);
    if (!card) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    card.confidence = confidence;
    card.last_reviewed_at = new Date();

    await kitDoc.save();

    return NextResponse.json({
      message: "Card confidence recorded",
      flashcard: card,
    });
  } catch (error: any) {
    console.error("[POST /api/kits/[id]/practice Error]", error);
    return NextResponse.json(
      { error: "Failed to record practice rating", details: error.message },
      { status: 500 }
    );
  }
}
