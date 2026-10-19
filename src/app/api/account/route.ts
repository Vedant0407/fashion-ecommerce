import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncUserProfile } from "@/lib/user-store";

const noStore = { "Cache-Control": "no-store" };

async function getIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  await syncUserProfile(data.user);
  return data.user;
}

export async function GET() {
  try {
    const authUser = await getIdentity();
    if (!authUser) return NextResponse.json({ success: false, message: "Please log in to view your account." }, { status: 401, headers: noStore });
    const [profile, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: authUser.id } }),
      prisma.address.findFirst({ where: { user_id: authUser.id }, orderBy: [{ is_default: "desc" }, { updated_at: "desc" }] }),
    ]);
    if (!profile) throw new Error("Account profile could not be loaded.");
    return NextResponse.json({
      success: true,
      profile: { id: profile.id, name: profile.name, email: profile.email, phone: profile.phone || "" },
      address: address ? { id: address.id, fullName: address.full_name, phone: address.phone, address: address.address_line1, city: address.city, state: address.state, pincode: address.postal_code } : null,
    }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/account error:", error);
    return NextResponse.json({ success: false, message: "Unable to load your account." }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getIdentity();
    if (!authUser) return NextResponse.json({ success: false, message: "Please log in to update your account." }, { status: 401, headers: noStore });
    const body = await request.json();
    if (body.profile !== undefined) {
      const name = typeof body.profile?.name === "string" ? body.profile.name.trim() : "";
      const phone = typeof body.profile?.phone === "string" ? body.profile.phone.trim() : "";
      if (name.length < 2 || name.length > 120 || phone.length > 40) return NextResponse.json({ success: false, message: "Enter a valid name and phone number." }, { status: 400, headers: noStore });
      await prisma.user.update({ where: { id: authUser.id }, data: { name, phone: phone || null } });
    }
    if (body.address !== undefined && body.address !== null) {
      const incoming = body.address;
      const fullName = typeof incoming.fullName === "string" ? incoming.fullName.trim() : "";
      const phone = typeof incoming.phone === "string" ? incoming.phone.trim() : "";
      const address = typeof incoming.address === "string" ? incoming.address.trim() : "";
      const city = typeof incoming.city === "string" ? incoming.city.trim() : "";
      const state = typeof incoming.state === "string" ? incoming.state.trim() : "";
      const pincode = typeof incoming.pincode === "string" ? incoming.pincode.trim() : "";
      if (fullName.length < 2 || phone.length < 7 || address.length < 4 || !city || !state || !/^\d{5,10}$/.test(pincode)) return NextResponse.json({ success: false, message: "Complete the name, phone, address, city, state, and PIN code." }, { status: 400, headers: noStore });
      await prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({ where: { user_id: authUser.id }, orderBy: [{ is_default: "desc" }, { updated_at: "desc" }] });
        await tx.address.updateMany({ where: { user_id: authUser.id }, data: { is_default: false } });
        const data = { full_name: fullName.slice(0, 120), phone: phone.slice(0, 40), address_line1: address.slice(0, 500), city: city.slice(0, 120), state: state.slice(0, 120), postal_code: pincode, country: "India", is_default: true };
        if (existing) await tx.address.update({ where: { id: existing.id }, data });
        else await tx.address.create({ data: { ...data, user_id: authUser.id } });
      });
    }
    return GET();
  } catch (error) {
    console.error("PATCH /api/account error:", error);
    return NextResponse.json({ success: false, message: "Unable to save your account changes." }, { status: 503, headers: noStore });
  }
}
