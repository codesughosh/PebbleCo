import express from "express";
import { supabase } from "../supabase.js";
import { verifyFirebaseUser as verifyFirebaseToken } from "../middleware/auth.js";

const router = express.Router();

function getStockValue(stock) {
  if (stock === null || stock === undefined || stock === "") return null;

  const value = Number(stock);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function parseCartQuantity(quantity) {
  const value = Number(quantity);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getStockError(stock, quantity) {
  if (stock === null) return null;
  if (stock === 0) return "Product is out of stock";
  if (quantity > stock) return `Only ${stock} left in stock`;
  return null;
}

async function fetchProductStock(productId) {
  const { data, error } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .single();

  if (error || !data) {
    return { error };
  }

  return {
    product: data,
    stock: getStockValue(data.stock),
  };
}

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { product_id: productId } = req.body;
    const requestedQuantity = parseCartQuantity(req.body.quantity);

    if (!productId || !requestedQuantity) {
      return res.status(400).json({ error: "Missing product_id or quantity" });
    }

    const { stock, error: productError } = await fetchProductStock(productId);

    if (productError) {
      console.error("Product stock fetch error:", productError);
      return res.status(404).json({ error: "Product not found" });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("cart")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchError) {
      console.error("Cart fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch cart item" });
    }

    const nextQuantity = Number(existing?.quantity || 0) + requestedQuantity;
    const stockError = getStockError(stock, nextQuantity);

    if (stockError) {
      return res.status(409).json({ error: stockError });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: nextQuantity })
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Cart update error:", updateError);
        return res.status(500).json({ error: "Failed to update cart" });
      }
    } else {
      const { error: insertError } = await supabase.from("cart").insert({
        user_id: userId,
        product_id: productId,
        quantity: requestedQuantity,
      });

      if (insertError) {
        console.error("Cart insert error:", insertError);
        return res.status(500).json({ error: "Failed to insert cart item" });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const { data, error } = await supabase
      .from("cart")
      .select(
        `
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          images,
          stock
        )
      `,
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Fetch cart error:", error);
      return res.status(500).json({ error: "Failed to fetch cart" });
    }

    res.json(data);
  } catch (err) {
    console.error("Fetch cart exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const quantity = parseCartQuantity(req.body.quantity);

    if (!quantity) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const { data: cartItem, error: cartError } = await supabase
      .from("cart")
      .select(
        `
        id,
        product:products (
          stock
        )
      `,
      )
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (cartError || !cartItem) {
      console.error("Cart stock fetch error:", cartError);
      return res.status(404).json({ error: "Cart item not found" });
    }

    const stock = getStockValue(cartItem.product?.stock);
    const stockError = getStockError(stock, quantity);

    if (stockError) {
      return res.status(409).json({ error: stockError });
    }

    const { error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Update cart error:", error);
      return res.status(500).json({ error: "Failed to update cart" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update cart exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Cart delete error:", error);
      return res.status(500).json({ error: "Failed to delete cart item" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
