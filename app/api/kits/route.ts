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
      .select("kitId status progressStage progressMessage source.company source.role source.company_url daysRequested createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ kits });
  } catch (error: any) {
    console.error("[GET /api/kits Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch kits", details: error.message },
      { status: 500 }
    );
  }
}
