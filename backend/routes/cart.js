import express from "express";
import { supabase } from "../supabase.js";
import verifyFirebaseToken from "../middleware/auth.js";

const router = express.Router();

/**
 * ADD / UPDATE CART ITEM
 */
router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: "Missing product_id or quantity" });
    }

    // 1️⃣ Check if item already exists in cart
    const { data: existing, error: fetchError } = await supabase
      .from("cart")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .maybeSingle(); // 👈 IMPORTANT (no crash if row doesn't exist)

    if (fetchError) {
      console.error("Cart fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch cart item" });
    }

    // 2️⃣ Update quantity if exists
    if (existing) {
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .eq("user_id", userId); // 👈 RLS-safe

      if (updateError) {
        console.error("Cart update error:", updateError);
        return res.status(500).json({ error: "Failed to update cart" });
      }
    } 
    // 3️⃣ Insert new row if not exists
    else {
      const { error: insertError } = await supabase.from("cart").insert({
        user_id: userId,
        product_id,
        quantity
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
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          images
        )
      `)
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
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
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


/**
 * DELETE CART ITEM
 */
router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // 👈 RLS-safe

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
