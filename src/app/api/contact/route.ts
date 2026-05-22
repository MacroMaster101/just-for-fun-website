import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Save message to database
    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    return NextResponse.json(
      { success: true, message: "Your message has been sent successfully!", data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact Form API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit contact message. Please try again.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
