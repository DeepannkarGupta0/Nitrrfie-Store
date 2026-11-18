import { supabase } from "./supabase";
import type { Template, Design } from "@/types";

// ─── Template Queries ─────────────────────────────────────────────────────────

export async function getTemplatesByProduct(productSlug: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("product_id", productSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTemplatesByProduct error:", error.message);
    return [];
  }
  return data as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getTemplateById error:", error.message);
    return null;
  }
  return data as Template;
}

export async function getAllTemplates(): Promise<Template[]> {
  const response = await fetch("/api/admin/templates", { cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json();
  return (result.templates ?? []) as Template[];
}

export async function createTemplate(
  template: Omit<Template, "id" | "created_at">,
  imageFile: File
): Promise<Template | null> {
  const form = new FormData();
  form.set("product_id", template.product_id);
  form.set("name", template.name);
  form.set("placements", JSON.stringify(template.placements));
  form.set("colors", JSON.stringify(template.colors));
  form.set("image", imageFile);
  const response = await fetch("/api/admin/templates", { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to create template");
  return result.template as Template;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<Template, "name" | "placements" | "colors" | "is_active">>
): Promise<Template | null> {
  const response = await fetch("/api/admin/templates", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, updates }),
  });
  const result = await response.json();
  if (!response.ok) return null;
  return result.template as Template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return response.ok;
}

// ─── Design Queries ───────────────────────────────────────────────────────────

export async function saveDesign(design: Omit<Design, "id" | "created_at">): Promise<Design | null> {
  const response = await fetch("/api/designs", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(design),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to save design");
  return result.design as Design;
}

export async function getDesignById(id: string): Promise<Design | null> {
  const response = await fetch(`/api/designs/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const result = await response.json();
  return (result.design ?? null) as Design | null;
}

export async function getUserDesigns(_userId: string): Promise<Design[]> {
  const response = await fetch("/api/designs", { cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json();
  return (result.designs ?? []) as Design[];
}

export async function updateDesignStatus(id: string, status: Design["status"]): Promise<boolean> {
  const response = await fetch(`/api/designs/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
  });
  return response.ok;
}

// ─── Design Image Upload ──────────────────────────────────────────────────────

export async function uploadDesignImage(
  blob: Blob,
  userId: string
): Promise<string | null> {
  const form = new FormData();
  form.set("image", new File([blob], "design-preview.png", { type: "image/png" }));
  const response = await fetch("/api/designs/upload", { method: "POST", body: form });
  if (!response.ok) return null;
  const result = await response.json();
  return typeof result.url === "string" ? result.url : null;
}
