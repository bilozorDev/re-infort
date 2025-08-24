import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isAdmin } from "@/app/utils/roles";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();

    return NextResponse.json({ isAdmin: userIsAdmin });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Failed to check user role" },
      { status: 500 }
    );
  }
}