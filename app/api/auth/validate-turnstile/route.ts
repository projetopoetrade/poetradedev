import { validateTurnstileToken } from "next-turnstile";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const validationResponse = await validateTurnstileToken({
      token,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    });

    if (!validationResponse.success) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to validate token" },
      { status: 500 }
    );
  }
} 