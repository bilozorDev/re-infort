import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesUpdate } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
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

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("company_id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      console.error("Error fetching contact:", error);
      return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/companies/[id]/contacts/[contactId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update contacts" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate email format if provided
    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.company_id;
    delete body.organization_clerk_id;
    delete body.created_at;
    delete body.created_by_clerk_user_id;
    delete body.created_by_name;

    const supabase = await createClient();

    const updateData: TablesUpdate<"contacts"> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contactId)
      .eq("company_id", id)
      .eq("organization_clerk_id", orgId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      // Check for duplicate email
      if (error.code === "23505" && error.message.includes("unique_contact_email_per_company")) {
        return NextResponse.json(
          { error: "A contact with this email already exists for this company" },
          { status: 409 }
        );
      }
      console.error("Error updating contact:", error);
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/companies/[id]/contacts/[contactId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete contacts" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const supabase = await createClient();

    // Check if this is the only contact for the company
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id")
      .eq("company_id", id)
      .eq("organization_clerk_id", orgId);

    if (contactsError) {
      console.error("Error checking contacts:", contactsError);
      return NextResponse.json({ error: "Failed to check contacts" }, { status: 500 });
    }

    if (contacts && contacts.length === 1) {
      return NextResponse.json(
        { error: "Cannot delete the only contact for a company" },
        { status: 400 }
      );
    }

    // Check if this is the primary contact
    const { data: contact, error: checkError } = await supabase
      .from("contacts")
      .select("is_primary")
      .eq("id", contactId)
      .eq("company_id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      console.error("Error checking contact:", checkError);
      return NextResponse.json({ error: "Failed to check contact" }, { status: 500 });
    }

    // Delete the contact
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("company_id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error deleting contact:", error);
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }

    // If we deleted the primary contact, set another contact as primary
    if (contact?.is_primary && contacts && contacts.length > 1) {
      const remainingContactId = contacts.find(c => c.id !== contactId)?.id;
      if (remainingContactId) {
        await supabase
          .from("contacts")
          .update({ is_primary: true })
          .eq("id", remainingContactId)
          .eq("company_id", id)
          .eq("organization_clerk_id", orgId);
      }
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/companies/[id]/contacts/[contactId]:", error);
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