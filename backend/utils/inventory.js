export class InventoryError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.name = "InventoryError";
    this.status = status;
  }
}

function getStockValue(stock) {
  if (stock === null || stock === undefined || stock === "") return null;

  const value = Number(stock);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function getProductId(item) {
  return item.product_id || item.product?.id || item.products?.id || null;
}

function getProductName(item) {
  return (
    item.product_name ||
    item.product?.name ||
    item.products?.name ||
    "Product"
  );
}

function normalizeOrderItems(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new InventoryError("Order items missing", 500);
  }

  const itemsByProduct = new Map();

  for (const item of orderItems) {
    const productId = getProductId(item);
    const quantity = Number(item.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new InventoryError("Order items are invalid", 500);
    }

    const existing = itemsByProduct.get(productId);
    itemsByProduct.set(productId, {
      productId,
      productName: existing?.productName || getProductName(item),
      quantity: (existing?.quantity || 0) + quantity,
    });
  }

  return Array.from(itemsByProduct.values());
}

export async function createStockDecrementPlan(supabase, orderItems) {
  const normalizedItems = normalizeOrderItems(orderItems);
  const productIds = normalizedItems.map((item) => item.productId);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, stock")
    .in("id", productIds);

  if (error) {
    console.error("Inventory product fetch failed:", error);
    throw new InventoryError("Could not check product stock", 500);
  }

  const productsById = new Map((products || []).map((product) => [product.id, product]));

  return normalizedItems
    .map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new InventoryError(`${item.productName} was not found`, 500);
      }

      const stock = getStockValue(product.stock);
      if (stock === null) return null;

      const productName = product.name || item.productName;
      if (item.quantity > stock) {
        throw new InventoryError(`Only ${stock} left for ${productName}`);
      }

      return {
        productId: item.productId,
        productName,
        previousStock: stock,
        nextStock: stock - item.quantity,
      };
    })
    .filter(Boolean);
}

export async function applyStockDecrementPlan(supabase, plan) {
  const appliedItems = [];

  try {
    for (const item of plan) {
      const { data, error } = await supabase
        .from("products")
        .update({ stock: item.nextStock })
        .eq("id", item.productId)
        .eq("stock", item.previousStock)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Inventory stock update failed:", error);
        throw new InventoryError(`Could not update stock for ${item.productName}`, 500);
      }

      if (!data) {
        throw new InventoryError(`Stock changed for ${item.productName}. Please retry.`);
      }

      appliedItems.push(item);
    }
  } catch (err) {
    for (const item of appliedItems.reverse()) {
      const { error: rollbackError } = await supabase
        .from("products")
        .update({ stock: item.previousStock })
        .eq("id", item.productId)
        .eq("stock", item.nextStock);

      if (rollbackError) {
        console.error("Inventory stock rollback failed:", rollbackError);
      }
    }

    throw err;
  }

  return plan;
}
