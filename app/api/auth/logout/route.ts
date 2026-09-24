import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  const cookieOptions = getAuthCookieOptions();
  response.cookies.set(cookieOptions.name, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
