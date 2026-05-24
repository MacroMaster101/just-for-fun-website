import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

// Helper helper function to verify administrator permission
async function verifyAdmin() {
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

    const admins = await prisma.adminEmail.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("GET Admin Emails Error:", error);
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.adminEmail.findUnique({
      where: { email: targetEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "This email is already an administrator." }, { status: 400 });
    }

    const newAdmin = await prisma.adminEmail.create({
      data: { email: targetEmail },
    });

    return NextResponse.json({ success: true, admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error("POST Admin Email Error:", error);
    return NextResponse.json({ error: "Failed to add administrator" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Prevent self-deletion for lockout prevention
    if (targetEmail === adminEmail) {
      return NextResponse.json({ error: "Self-deletion is blocked. You cannot remove your own administrator status." }, { status: 400 });
    }

    await prisma.adminEmail.delete({
      where: { email: targetEmail },
    });

    return NextResponse.json({ success: true, message: "Administrator removed successfully." }, { status: 200 });
  } catch (error) {
    console.error("DELETE Admin Email Error:", error);
    return NextResponse.json({ error: "Failed to remove administrator" }, { status: 500 });
  }
}
