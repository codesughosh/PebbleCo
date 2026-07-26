const SHIPPING_FEE = 60;
const MAX_CART_QUANTITY = 99;
const VALID_DELIVERY_TYPES = new Set(["shipping", "inhand"]);

export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

function cleanString(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function hasValidPhone(phone) {
  return /^\d{10}$/.test(phone);
}

function hasValidPincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

export function getShippingFee(deliveryType) {
  return deliveryType === "shipping" ? SHIPPING_FEE : 0;
}

export function normalizeDeliveryDetails({
  deliveryType,
  shippingAddress,
  inhandDetails,
}) {
  if (!VALID_DELIVERY_TYPES.has(deliveryType)) {
    throw new CheckoutError("Invalid delivery type");
  }

  if (deliveryType === "inhand") {
    const customerName = cleanString(inhandDetails?.name, 80);
    const customerPhone = cleanString(inhandDetails?.phone, 20);

    if (!customerName || !hasValidPhone(customerPhone)) {
      throw new CheckoutError("Invalid in-hand customer details");
    }

    return {
      deliveryType,
      customerName,
      customerPhone,
      shippingAddress: null,
    };
  }

  const customerName = cleanString(shippingAddress?.name, 80);
  const customerPhone = cleanString(shippingAddress?.phone, 20);
  const line1 = cleanString(
    shippingAddress?.line1 || shippingAddress?.address,
    180,
  );
  const city = cleanString(shippingAddress?.city, 80);
  const state = cleanString(shippingAddress?.state, 80);
  const pincode = cleanString(shippingAddress?.pincode, 12);

  if (
    !customerName ||
    !hasValidPhone(customerPhone) ||
    !line1 ||
    !city ||
    !state ||
    !hasValidPincode(pincode)
  ) {
    throw new CheckoutError("Invalid shipping address");
  }

  return {
    deliveryType,
    customerName,
    customerPhone,
    shippingAddress: {
      name: customerName,
      phone: customerPhone,
      line1,
      city,
      state,
      pincode,
      locationResolved: true,
    },
  };
}

export async function fetchCheckoutCart(supabase, userId) {
  const { data, error } = await supabase
    .from("cart")
    .select(
      `
        id,
        quantity,
        product:products (
          id,
          name,
          price
        )
      `,
    )
    .eq("user_id", userId);

  if (error) {
    throw new CheckoutError("Could not load cart", 500);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new CheckoutError("Cart is empty");
  }

  return data.map((item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.product?.price);

    if (
      !item.product?.id ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_CART_QUANTITY ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new CheckoutError("Cart has invalid items");
    }

    return {
      id: item.id,
      quantity,
      product: {
        id: item.product.id,
        name: cleanString(item.product.name, 120) || "Product",
        price,
      },
    };
  });
}

export function buildOrderItems(orderId, cartItems) {
  return cartItems.map((item) => ({
    order_id: orderId,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    price_at_purchase: item.product.price,
  }));
}

export function calculateCheckoutTotal(cartItems, deliveryType) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  return subtotal + getShippingFee(deliveryType);
}

export function calculateOrderItemsTotal(orderItems, deliveryType) {
  const subtotal = orderItems.reduce(
    (sum, item) => {
      const quantity = Number(item.quantity);
      const authoritativePrice = Number(
        item.product?.price ?? item.products?.price ?? item.price_at_purchase,
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_CART_QUANTITY ||
        !Number.isFinite(authoritativePrice) ||
        authoritativePrice < 0
      ) {
        throw new CheckoutError("Order items are invalid", 500);
      }

      return sum + quantity * authoritativePrice;
    },
    0,
  );

  return subtotal + getShippingFee(deliveryType);
}

export function normalizeUpiTransactionId(value) {
  const transactionId = cleanString(value, 80);

  if (
    transactionId.length < 6 ||
    !/^[A-Za-z0-9._/-]+$/.test(transactionId)
  ) {
    throw new CheckoutError("Invalid UPI transaction ID");
  }

  return transactionId;
}

export async function assertUniquePaymentId(supabase, paymentId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("payment_id", paymentId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new CheckoutError("Could not verify payment ID", 500);
  }

  if (data) {
    throw new CheckoutError("This payment ID is already used", 409);
  }
}
