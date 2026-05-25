import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    
    if (!data.user || !data.user.email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const email = data.user.email.toLowerCase().trim();

    // Check if they are the configured root admin email in environment variables
    const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
    if (rootAdminEmail && email === rootAdminEmail) {
      // Proactively ensure they exist in the DB roster
      try {
        await prisma.adminEmail.upsert({
          where: { email },
          update: {},
          create: { email },
        });
      } catch (e) {
        console.error("Failed to seed root admin on check:", e);
      }
      return NextResponse.json({ isAdmin: true, email }, { status: 200 });
    }

    // Verify if the user's email exists in the AdminEmail table
    const adminMatch = await prisma.adminEmail.findUnique({
      where: { email },
    });

    if (adminMatch) {
      return NextResponse.json({ isAdmin: true, email }, { status: 200 });
    }

    return NextResponse.json({ isAdmin: false, email }, { status: 200 });
  } catch (error) {
    console.error("Admin Check API Error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
