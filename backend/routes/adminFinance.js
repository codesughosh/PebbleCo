import express from "express";
import { supabase } from "../supabase.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

const EXPENSE_CATEGORIES = new Set([
  "Raw Materials",
  "Packaging",
  "Shipping",
  "Marketing",
  "Tools",
  "Fees",
  "Other",
]);

function normalizeText(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sumMoney(rows, selector) {
  return rows.reduce((sum, row) => sum + toNumber(selector(row)), 0);
}

function isExpenseTableMissing(error) {
  if (!error) return false;

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    String(error.message || "").includes("business_expenses")
  );
}

function monthKey(value) {
  const date = new Date(value || Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

function createMonthBuckets() {
  const buckets = new Map();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = monthKey(date);
    buckets.set(key, {
      key,
      label: monthLabel(key),
      bookings: 0,
      income: 0,
      expenses: 0,
      net: 0,
    });
  }

  return buckets;
}

function buildReport(orders, expenses) {
  const activeOrders = orders.filter((order) => order.payment_status !== "rejected");
  const paidOrders = orders.filter((order) => order.payment_status === "success");
  const pendingOrders = orders.filter(
    (order) =>
      order.payment_status === "pending" ||
      order.payment_status === "pending_verification",
  );
  const expenseRows = expenses || [];
  const expenseTotal = sumMoney(expenseRows, (expense) => expense.amount);
  const paidIncome = sumMoney(paidOrders, (order) => order.total);
  const allBookings = sumMoney(activeOrders, (order) => order.total);
  const pendingBookings = sumMoney(pendingOrders, (order) => order.total);
  const buckets = createMonthBuckets();
  const expenseCategories = {};

  activeOrders.forEach((order) => {
    const key = monthKey(order.created_at);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: monthLabel(key),
        bookings: 0,
        income: 0,
        expenses: 0,
        net: 0,
      });
    }

    const bucket = buckets.get(key);
    const total = toNumber(order.total);
    bucket.bookings += total;

    if (order.payment_status === "success") {
      bucket.income += total;
    }
  });

  expenseRows.forEach((expense) => {
    const key = monthKey(expense.spent_at || expense.created_at);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: monthLabel(key),
        bookings: 0,
        income: 0,
        expenses: 0,
        net: 0,
      });
    }

    const amount = toNumber(expense.amount);
    const bucket = buckets.get(key);
    bucket.expenses += amount;
    expenseCategories[expense.category || "Other"] =
      (expenseCategories[expense.category || "Other"] || 0) + amount;
  });

  const monthlyTrend = Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => ({
      ...bucket,
      net: bucket.income - bucket.expenses,
    }));

  return {
    totals: {
      allBookings,
      paidIncome,
      pendingBookings,
      expenses: expenseTotal,
      netProfit: paidIncome - expenseTotal,
      orderCount: activeOrders.length,
      paidOrderCount: paidOrders.length,
      pendingOrderCount: pendingOrders.length,
      itemCount: activeOrders.reduce(
        (sum, order) =>
          sum +
          (order.order_items || []).reduce(
            (itemSum, item) => itemSum + Number(item.quantity || 0),
            0,
          ),
        0,
      ),
    },
    monthlyTrend,
    expenseCategories: Object.entries(expenseCategories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    bookings: activeOrders,
    recentBookings: activeOrders.slice(0, 10),
    recentExpenses: expenseRows.slice(0, 10),
  };
}

async function fetchExpenses() {
  const { data, error } = await supabase
    .from("business_expenses")
    .select("id, title, category, amount, spent_at, note, created_at")
    .order("spent_at", { ascending: false });

  if (isExpenseTableMissing(error)) {
    return { expenses: [], tableReady: false };
  }

  if (error) throw error;

  return { expenses: data || [], tableReady: true };
}

router.get("/finance", verifyAdmin, async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
          id,
          total,
          payment_status,
          status,
          payment_id,
          delivery_type,
          customer_name,
          customer_phone,
          customer_email,
          created_at,
          order_items (
            id,
            product_name,
            quantity,
            price_at_purchase,
            products ( name )
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (ordersError) {
      return res.status(500).json({ error: "Could not load orders" });
    }

    const { expenses, tableReady } = await fetchExpenses();
    const report = buildReport(orders || [], expenses);

    res.json({
      success: true,
      expenseTableReady: tableReady,
      categories: Array.from(EXPENSE_CATEGORIES),
      ...report,
    });
  } catch (err) {
    console.error("Admin finance report failed:", err);
    res.status(500).json({ error: "Could not load finance report" });
  }
});

router.post("/finance/expenses", verifyAdmin, async (req, res) => {
  try {
    const title = normalizeText(req.body.title, 90);
    const category = EXPENSE_CATEGORIES.has(req.body.category)
      ? req.body.category
      : "Other";
    const note = normalizeText(req.body.note, 260);
    const amount = Number(req.body.amount);
    const spentAt = req.body.spent_at ? new Date(req.body.spent_at) : new Date();

    if (!title) {
      return res.status(400).json({ error: "Expense title is required" });
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return res.status(400).json({ error: "Invalid expense amount" });
    }

    if (Number.isNaN(spentAt.getTime())) {
      return res.status(400).json({ error: "Invalid expense date" });
    }

    const { data, error } = await supabase
      .from("business_expenses")
      .insert({
        title,
        category,
        amount,
        spent_at: spentAt.toISOString(),
        note: note || null,
        created_by_uid: req.user.uid,
        created_by_email: req.user.email || null,
      })
      .select()
      .single();

    if (isExpenseTableMissing(error)) {
      return res.status(424).json({ error: "Expense table is not set up" });
    }

    if (error) {
      console.error("Expense insert failed:", error);
      return res.status(500).json({ error: "Could not save expense" });
    }

    res.json({ success: true, expense: data });
  } catch (err) {
    console.error("Admin expense save failed:", err);
    res.status(500).json({ error: "Could not save expense" });
  }
});

router.delete("/finance/expenses/:id", verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("business_expenses")
      .delete()
      .eq("id", req.params.id);

    if (isExpenseTableMissing(error)) {
      return res.status(424).json({ error: "Expense table is not set up" });
    }

    if (error) {
      console.error("Expense delete failed:", error);
      return res.status(500).json({ error: "Could not delete expense" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin expense delete failed:", err);
    res.status(500).json({ error: "Could not delete expense" });
  }
});

export default router;
