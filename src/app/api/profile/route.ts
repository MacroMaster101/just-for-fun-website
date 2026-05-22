import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id, email, name, bio, avatarUrl } = await request.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: "User ID and Email are required." },
        { status: 400 }
      );
    }

    // Upsert user profile in PostgreSQL database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        bio,
        avatarUrl,
      },
      create: {
        id,
        email,
        name,
        bio,
        avatarUrl,
      },
    });

    return NextResponse.json(
      { success: true, message: "Profile updated successfully!", data: user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
