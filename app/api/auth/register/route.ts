import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/client";
import { UserModel } from "@/lib/db/models/User";
import { signSessionToken, getAuthCookieOptions } from "@/lib/auth/session";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password (min 6 characters)" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    await connectToDatabase();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      email: email.toLowerCase(),
      passwordHash,
    });

    const sessionUser = { userId: newUser._id.toString(), email: newUser.email };
    const token = signSessionToken(sessionUser);

    const response = NextResponse.json({
      user: sessionUser,
      message: "Registration successful",
    });

    const cookieOptions = getAuthCookieOptions();
    response.cookies.set(cookieOptions.name, token, cookieOptions);

    return response;
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: "Registration failed", details: error.message },
      { status: 500 }
    );
  }
}
