import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

export async function GET(request: NextRequest) {
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
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const tags = searchParams.get("tags");
    const withContacts = searchParams.get("withContacts") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    let query = supabase
      .from("companies")
      .select(withContacts ? `
        *,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          title,
          is_primary
        )
      ` : "*")
      .eq("organization_clerk_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,website.ilike.%${search}%,industry.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply tags filter
    if (tags) {
      const tagArray = tags.split(",");
      query = query.contains("tags", tagArray);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching companies:", error);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      count,
      limit,
      offset 
    });
  } catch (error) {
    console.error("Error in GET /api/companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create companies" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.primaryContact?.email && !isValidEmail(body.primaryContact.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const userName = await getCurrentUserName();

    // Start a transaction by creating company and contact together
    const companyData: TablesInsert<"companies"> = {
      organization_clerk_id: orgId,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
      name: body.name,
      website: body.website || null,
      industry: body.industry || null,
      company_size: body.company_size || null,
      tax_id: body.tax_id || null,
      address: body.address || null,
      city: body.city || null,
      state_province: body.state_province || null,
      postal_code: body.postal_code || null,
      country: body.country || null,
      notes: body.notes || null,
      tags: body.tags || [],
      status: body.status || "active",
    };

    // Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert(companyData)
      .select()
      .single();

    if (companyError) {
      // Check for duplicate company name
      if (companyError.code === "23505" && companyError.message.includes("unique_company_name_per_org")) {
        return NextResponse.json(
          { error: "A company with this name already exists in your organization" },
          { status: 409 }
        );
      }
      
      console.error("Error creating company:", companyError);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    // If primary contact was provided, create it
    if (body.primaryContact) {
      const contactData: TablesInsert<"contacts"> = {
        organization_clerk_id: orgId,
        company_id: company.id,
        created_by_clerk_user_id: userId,
        created_by_name: userName,
        first_name: body.primaryContact.first_name,
        last_name: body.primaryContact.last_name,
        email: body.primaryContact.email || null,
        phone: body.primaryContact.phone || null,
        mobile: body.primaryContact.mobile || null,
        title: body.primaryContact.title || null,
        department: body.primaryContact.department || null,
        is_primary: true,
        status: "active",
      };

      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert(contactData)
        .select()
        .single();

      if (contactError) {
        console.error("Error creating primary contact:", contactError);
        // Note: Company was created, so we don't rollback
        return NextResponse.json(
          { 
            data: company,
            warning: "Company created but failed to create primary contact" 
          },
          { status: 201 }
        );
      }

      // Return company with contact
      return NextResponse.json(
        { 
          ...company,
          contacts: [contact]
        },
        { status: 201 }
      );
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/companies:", error);
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