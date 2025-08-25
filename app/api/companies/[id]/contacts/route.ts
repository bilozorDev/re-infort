import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const supabase = await createClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("company_id", params.id)
      .eq("organization_clerk_id", orgId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/companies/[id]/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create contacts" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify company exists and belongs to org
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", params.id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const userName = await getCurrentUserName();

    const contactData: TablesInsert<"contacts"> = {
      organization_clerk_id: orgId,
      company_id: params.id,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email || null,
      phone: body.phone || null,
      mobile: body.mobile || null,
      title: body.title || null,
      department: body.department || null,
      is_primary: body.is_primary || false,
      preferred_contact_method: body.preferred_contact_method || null,
      has_different_address: body.has_different_address || false,
      address: body.address || null,
      city: body.city || null,
      state_province: body.state_province || null,
      postal_code: body.postal_code || null,
      country: body.country || null,
      notes: body.notes || null,
      birthday: body.birthday || null,
      status: body.status || "active",
    };

    const { data, error } = await supabase
      .from("contacts")
      .insert(contactData)
      .select()
      .single();

    if (error) {
      // Check for duplicate email
      if (error.code === "23505" && error.message.includes("unique_contact_email_per_company")) {
        return NextResponse.json(
          { error: "A contact with this email already exists for this company" },
          { status: 409 }
        );
      }
      
      console.error("Error creating contact:", error);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/companies/[id]/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}