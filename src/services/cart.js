import { supabase } from "../supabaseClient";

export async function addToCart(userId, productId) {
  const { data: existingItem, error: fetchError } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Fetch cart error:", fetchError);
    throw fetchError;
  }

  if (existingItem) {
    const { error } = await supabase
      .from("cart")
      .update({ quantity: existingItem.quantity + 1 })
      .eq("id", existingItem.id);

    if (error) {
      console.error("Update cart error:", error);
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("cart").insert([
    {
      user_id: userId,
      product_id: productId,
      quantity: 1,
    },
  ]);

  if (error) {
    console.error("Insert cart error:", error);
    throw error;
  }
}
