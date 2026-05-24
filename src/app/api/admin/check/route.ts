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

    // Auto-Bootstrapper: Seed the root administrator email dynamically if no admins exist yet
    const adminCount = await prisma.adminEmail.count();
    if (adminCount === 0) {
      const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
      if (rootAdminEmail) {
        await prisma.adminEmail.create({
          data: { email: rootAdminEmail },
        });
      }
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
