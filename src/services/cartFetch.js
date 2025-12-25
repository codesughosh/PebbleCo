import { supabase } from "../supabaseClient";

export async function getCartItems(userId) {
  const { data, error } = await supabase
    .from("cart")
    .select(`
      id,
      quantity,
      product:products (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Fetch cart error:", error);
    return [];
  }

  return data;
}
