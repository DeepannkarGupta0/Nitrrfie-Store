import { supabase } from "./supabase";
import type { Product } from "@/types";
import { products as localProducts } from "@/data/products";

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error || !data || data.length === 0 || data.some(p => p.slug === "404-not-found-tee")) {
      return localProducts.filter(p => !p.id.startsWith("legacy-"));
    }

    return data as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return localProducts.filter(p => !p.id.startsWith("legacy-"));
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const localMatch = localProducts.find(p => p.slug === slug);
  if (localMatch) return localMatch;

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Product;
  } catch (error) {
    return null;
  }
}
export async function addProduct(
  productData: Omit<Product, "id" | "image">,
  imageFile: File
): Promise<Product> {
  const fileName = `${Date.now()}-${imageFile.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, imageFile);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  const imageUrl = urlData.publicUrl;

  const { data, error } = await supabase
    .from("products")
    .insert([{ ...productData, image: imageUrl }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}