import { NextResponse } from "next/server";
import { isAdminEmail, verifiedEmail } from "@/lib/auth/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();

    // Only a verified email can grant admin access.
    const email = verifiedEmail(data.user);
    if (!email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const isAdmin = await isAdminEmail(email);
    return NextResponse.json({ isAdmin, email }, { status: 200 });
  } catch (error) {
    console.error("Admin Check API Error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
