import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/escapeHtml";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Collapse CR/LF so the name can't break out of the email subject line.
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ");

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = singleLine(str(body?.name));
    const email = str(body?.email);
    const message = str(body?.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }
    if (
      name.length > MAX_NAME_LENGTH ||
      email.length > MAX_EMAIL_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` },
        { status: 400 }
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Attach the user id if the sender is logged in (best-effort).
    let userId: string | null = null;
    try {
      const supabase = await supabaseServer();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      // Auth lookup is non-critical for contact form submissions.
    }

    // 1. Store the message in the Postgres Database
    const newMessage = await prisma.contactMessage.create({
      data: { name, email, message, userId },
    });

    // 2. Dispatch SMTP Gmail alert if both user and password exist in environments
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message);

        const mailOptions = {
          from: `"Just For Fun Website" <${smtpUser}>`,
          to: smtpUser, // Send to self
          replyTo: email, // Direct replies back to the sender
          subject: `📩 New Contact Form Message from ${name}`,
          text: `You have received a new contact form message on your website:\n\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `User ID: ${userId || "Guest User"}\n\n` +
                `Message:\n${message}\n\n` +
                `Received at: ${new Date().toLocaleString()}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-top: 4px solid #ff0033; padding: 24px; border-radius: 8px; background-color: #fcfcfc;">
              <h2 style="color: #111; margin-top: 0; font-weight: 800;">📩 New Contact Message</h2>
              <p style="color: #666; font-size: 14px;">You have received a new contact form submission on your website.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
                  <td style="padding: 6px 0; color: #111;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 6px 0; color: #0066cc;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">User ID:</td>
                  <td style="padding: 6px 0; color: #777; font-family: monospace;">${userId || "Guest User"}</td>
                </tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-weight: bold; color: #555; font-size: 14px; margin-bottom: 8px;">Message:</p>
              <div style="background-color: #f5f5f5; padding: 16px; border-radius: 6px; color: #222; font-size: 14px; white-space: pre-wrap; border-left: 3px solid #ff2d55;">${safeMessage}</div>
              <p style="color: #999; font-size: 11px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">Received at: ${new Date().toLocaleString()}</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("Failed to send contact notification email:", emailError);
        // Non-blocking catch to guarantee the user's form submission still succeeds
      }
    }

    return NextResponse.json(
      { success: true, message: "Your message has been sent successfully!", data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact Form API Error:", error);
    // Don't leak internal error details (DB/SMTP) to the client.
    return NextResponse.json(
      { error: "Failed to submit contact message. Please try again." },
      { status: 500 }
    );
  }
}
