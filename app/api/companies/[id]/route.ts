import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesUpdate } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const withContacts = searchParams.get("withContacts") === "true";

    const query = supabase
      .from("companies")
      .select(withContacts ? `
        *,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          mobile,
          title,
          department,
          is_primary,
          status,
          notes,
          has_different_address,
          address,
          city,
          state_province,
          postal_code,
          country
        )
      ` : "*")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      console.error("Error fetching company:", error);
      return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/companies/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update companies" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.organization_clerk_id;
    delete body.created_at;
    delete body.created_by_clerk_user_id;
    delete body.created_by_name;

    const supabase = await createClient();

    const updateData: TablesUpdate<"companies"> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      // Check for duplicate company name
      if (error.code === "23505" && error.message.includes("unique_company_name_per_org")) {
        return NextResponse.json(
          { error: "A company with this name already exists in your organization" },
          { status: 409 }
        );
      }
      console.error("Error updating company:", error);
      return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/companies/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete companies" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const supabase = await createClient();

    // Check if company has any quotes
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("id")
      .eq("company_id", id)
      .limit(1);

    if (quotesError) {
      console.error("Error checking company quotes:", quotesError);
      return NextResponse.json({ error: "Failed to check company dependencies" }, { status: 500 });
    }

    if (quotes && quotes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with existing quotes. Please archive it instead." },
        { status: 400 }
      );
    }

    // Delete the company (contacts will be cascade deleted)
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      console.error("Error deleting company:", error);
      return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
    }

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/companies/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}