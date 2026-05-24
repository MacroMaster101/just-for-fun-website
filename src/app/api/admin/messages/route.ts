import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Verifies the caller is an administrator and returns their email if so.
 * Returns null when the caller is not authenticated or not on the
 * admin allowlist.
 */
async function verifyAdmin(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return null;

  const email = data.user.email.toLowerCase().trim();
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

  if (rootAdminEmail && email === rootAdminEmail) {
    // Proactively ensure they exist in the DB
    try {
      await prisma.adminEmail.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } catch (e) {
      console.error("Failed to seed root admin on check:", e);
    }
    return email;
  }

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return match ? email : null;
}

export async function GET() {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("GET Contact Messages Error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Contact message deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("DELETE Contact Message Error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

/**
 * Admin reply to a contact message. Two delivery paths:
 *   - If the original message was submitted by a logged-in user (userId is
 *     set), write a Notification row so the user sees it in their
 *     UserMenu dropdown next time they're on the site.
 *   - If it was a guest submission (no userId), dispatch an SMTP email
 *     to the sender's address via Gmail (same transporter the contact
 *     form already uses).
 *
 * Both paths also stamp ContactMessage.{replyText, repliedAt, repliedBy}
 * so the inbox can show "replied" state without a join.
 */
export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { id, reply } = await request.json();
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Message id is required." }, { status: 400 });
    }
    const cleanReply = typeof reply === "string" ? reply.trim() : "";
    if (cleanReply.length === 0) {
      return NextResponse.json({ error: "Reply text cannot be empty." }, { status: 400 });
    }
    if (cleanReply.length > 5000) {
      return NextResponse.json({ error: "Reply is too long (max 5000 chars)." }, { status: 400 });
    }

    const original = await prisma.contactMessage.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    // Stamp the reply on the original message + create the appropriate
    // delivery record in a single transaction so we never end up with a
    // notification but no audit trail (or vice versa).
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.contactMessage.update({
        where: { id },
        data: {
          replyText: cleanReply,
          repliedAt: new Date(),
          repliedBy: adminEmail,
        },
      });

      let notification = null;
      if (original.userId) {
        notification = await tx.notification.create({
          data: {
            userId: original.userId,
            kind: "contact_reply",
            title: "Reply from Just For Fun",
            body: cleanReply,
            sourceId: original.id,
          },
        });
      }

      return { updated, notification };
    });

    // Guest sender → email. Outside the transaction so a slow/flaky SMTP
    // never blocks the DB write.
    let emailed = false;
    if (!original.userId) {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: smtpUser, pass: smtpPass },
          });
          await transporter.sendMail({
            from: `"Just For Fun" <${smtpUser}>`,
            to: original.email,
            replyTo: smtpUser,
            subject: "Reply from Just For Fun",
            text: `Hi ${original.name},\n\n${cleanReply}\n\n— Just For Fun team`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-top: 4px solid #ff0033; padding: 24px; border-radius: 8px;">
                <h2 style="color: #111; margin-top: 0; font-weight: 800;">Reply from Just For Fun</h2>
                <p style="color: #555;">Hi ${original.name},</p>
                <div style="background-color: #f5f5f5; padding: 16px; border-radius: 6px; color: #222; white-space: pre-wrap; border-left: 3px solid #ff2d55; margin: 16px 0;">${cleanReply}</div>
                <p style="color: #999; font-size: 12px;">— Just For Fun team</p>
              </div>
            `,
          });
          emailed = true;
        } catch (emailError) {
          console.error("Failed to send reply email:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: result.updated,
      delivery: original.userId ? "notification" : emailed ? "email" : "stored_only",
    });
  } catch (error) {
    console.error("POST reply error:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
