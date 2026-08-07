import { supabase } from "../supabaseClient";
import { getStockValue } from "../utils/productStatus";

export async function addToCart(userId, productId) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .single();

  if (productError) {
    console.error("Fetch product stock error:", productError);
    throw productError;
  }

  const stock = getStockValue(product?.stock);

  if (stock === 0) {
    throw new Error("Product is out of stock");
  }

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

  if (stock !== null && Number(existingItem?.quantity || 0) + 1 > stock) {
    throw new Error(`Only ${stock} left in stock`);
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
