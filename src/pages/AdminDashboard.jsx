import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  CreditCard,
  IndianRupee,
  Loader2,
  PackageCheck,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { auth } from "../firebase";
import { PageLoader } from "../components/Skeleton";
import "../styles/adminDashboard.css";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const emptyFinance = {
  totals: {
    allBookings: 0,
    paidIncome: 0,
    pendingBookings: 0,
    manualIncome: 0,
    grossOrderIncome: 0,
    netOrderIncome: 0,
    razorpayFees: 0,
    expenses: 0,
    netProfit: 0,
    orderCount: 0,
    paidOrderCount: 0,
    pendingOrderCount: 0,
    itemCount: 0,
  },
  monthlyTrend: [],
  expenseCategories: [],
  incomeSources: [],
  bookings: [],
  recentBookings: [],
  recentIncome: [],
  recentExpenses: [],
  categories: [],
  incomeSourceOptions: [],
  expenseTableReady: true,
  incomeTableReady: true,
};

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [finance, setFinance] = useState(emptyFinance);
  const [error, setError] = useState("");
  const [incomeState, setIncomeState] = useState("idle");
  const [expenseState, setExpenseState] = useState("idle");
  const [deletingIncomeId, setDeletingIncomeId] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [incomeForm, setIncomeForm] = useState({
    title: "",
    source: "Stall",
    amount: "",
    received_at: getTodayInputValue(),
    note: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Raw Materials",
    amount: "",
    spent_at: getTodayInputValue(),
    note: "",
  });

  const fetchFinance = useCallback(async (adminUser) => {
    if (!adminUser) return;

    try {
      setError("");
      const token = await adminUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/finance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not load finance report");
      }

      setFinance({
        ...emptyFinance,
        ...data,
        totals: {
          ...emptyFinance.totals,
          ...(data.totals || {}),
        },
      });
    } catch (err) {
      console.error("Finance report load failed:", err);
      setError(err.message || "Could not load finance report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        const tokenResult = await currentUser.getIdTokenResult(true);

        if (!tokenResult.claims.admin) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        await fetchFinance(currentUser);
      } catch (err) {
        console.error("Admin dashboard auth failed:", err);
        setUnauthorized(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchFinance]);

  const maxChartValue = useMemo(() => {
    const values = finance.monthlyTrend.flatMap((month) => [
      month.bookings,
      month.income,
      month.expenses,
    ]);

    return Math.max(1, ...values);
  }, [finance.monthlyTrend]);

  const maxCategoryValue = useMemo(
    () =>
      Math.max(
        1,
        ...finance.expenseCategories.map((category) => category.amount),
      ),
    [finance.expenseCategories],
  );

  const formatMoney = (value) => {
    const number = Number(value || 0);
    const hasPaisa = Math.round(number * 100) % 100 !== 0;

    return `${"\u20B9"}${number.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaisa ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "--";

  const getBookingItems = (booking) =>
    (booking.order_items || [])
      .map(
        (item) =>
          `${item.product_name || item.products?.name || "Product"} x ${
            item.quantity
          }`,
      )
      .join(", ");

  const submitIncome = async (event) => {
    event.preventDefault();

    if (incomeState !== "idle" || !finance.incomeTableReady || !user) return;

    try {
      setIncomeState("loading");
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/finance/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(incomeForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not save income");
      }

      setIncomeForm({
        title: "",
        source: finance.incomeSourceOptions[0] || "Stall",
        amount: "",
        received_at: getTodayInputValue(),
        note: "",
      });
      setIncomeState("success");
      await fetchFinance(user);
      window.setTimeout(() => setIncomeState("idle"), 900);
    } catch (err) {
      console.error("Income save failed:", err);
      alert(err.message || "Could not save income");
      setIncomeState("idle");
    }
  };

  const deleteIncome = async (incomeId) => {
    if (!user || deletingIncomeId) return;

    try {
      setDeletingIncomeId(incomeId);
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/finance/income/${incomeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not delete income");
      }

      await fetchFinance(user);
    } catch (err) {
      console.error("Income delete failed:", err);
      alert(err.message || "Could not delete income");
    } finally {
      setDeletingIncomeId(null);
    }
  };

  const submitExpense = async (event) => {
    event.preventDefault();

    if (expenseState !== "idle" || !finance.expenseTableReady || !user) return;

    try {
      setExpenseState("loading");
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/finance/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not save expense");
      }

      setExpenseForm({
        title: "",
        category: finance.categories[0] || "Raw Materials",
        amount: "",
        spent_at: getTodayInputValue(),
        note: "",
      });
      setExpenseState("success");
      await fetchFinance(user);
      window.setTimeout(() => setExpenseState("idle"), 900);
    } catch (err) {
      console.error("Expense save failed:", err);
      alert(err.message || "Could not save expense");
      setExpenseState("idle");
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!user || deletingExpenseId) return;

    try {
      setDeletingExpenseId(expenseId);
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_BASE}/api/admin/finance/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not delete expense");
      }

      await fetchFinance(user);
    } catch (err) {
      console.error("Expense delete failed:", err);
      alert(err.message || "Could not delete expense");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  if (loading) return <PageLoader label="Loading admin dashboard..." />;

  if (unauthorized) {
    return (
      <div className="admin-erp-state">
        <div className="admin-erp-state-card">
          <ShieldCheck size={24} strokeWidth={1.8} />
          <p>Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-erp">
      <header className="admin-erp-head">
        <div>
          <span className="admin-erp-kicker">Admin ERP</span>
          <h1>PebbleCo Business</h1>
          <p>Money, bookings, expenses, and order health in one place.</p>
        </div>

        <Link to="/admin/orders" className="admin-erp-link">
          <ClipboardList size={16} strokeWidth={2} />
          Orders
        </Link>
      </header>

      <nav className="admin-erp-tabs" aria-label="Admin dashboard tabs">
        {[
          ["overview", "Overview"],
          ["bookings", "Bookings"],
          ["income", "Income"],
          ["expenses", "Expenses"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="admin-erp-error">{error}</p>}

      {activeTab === "overview" && (
        <>
          <section className="admin-erp-metrics">
            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <Wallet size={20} strokeWidth={1.9} />
              </span>
              <p>All bookings</p>
              <strong>{formatMoney(finance.totals.allBookings)}</strong>
              <small>{finance.totals.orderCount} active orders</small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <IndianRupee size={20} strokeWidth={1.9} />
              </span>
              <p>Received income</p>
              <strong>{formatMoney(finance.totals.paidIncome)}</strong>
              <small>
                After {formatMoney(finance.totals.razorpayFees)} Razorpay fee
              </small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <ReceiptText size={20} strokeWidth={1.9} />
              </span>
              <p>Expenses</p>
              <strong>{formatMoney(finance.totals.expenses)}</strong>
              <small>Business spend</small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <TrendingUp size={20} strokeWidth={1.9} />
              </span>
              <p>Net profit</p>
              <strong>{formatMoney(finance.totals.netProfit)}</strong>
              <small>Received income minus expenses</small>
            </article>
          </section>

          <section className="admin-erp-grid">
            <article className="admin-erp-card chart-card">
              <div className="admin-card-title">
                <BarChart3 size={19} strokeWidth={1.9} />
                <h2>Financial Report</h2>
              </div>

              <div className="finance-chart">
                {finance.monthlyTrend.map((month) => (
                  <div className="finance-chart-group" key={month.key}>
                    <div className="finance-bars">
                      <span
                        className="finance-bar bookings"
                        style={{
                          height: `${Math.max(
                            4,
                            (month.bookings / maxChartValue) * 100,
                          )}%`,
                        }}
                        title={`Bookings ${formatMoney(month.bookings)}`}
                      />
                      <span
                        className="finance-bar income"
                        style={{
                          height: `${Math.max(
                            4,
                            (month.income / maxChartValue) * 100,
                          )}%`,
                        }}
                        title={`Income ${formatMoney(month.income)}`}
                      />
                      <span
                        className="finance-bar expenses"
                        style={{
                          height: `${Math.max(
                            4,
                            (month.expenses / maxChartValue) * 100,
                          )}%`,
                        }}
                        title={`Expenses ${formatMoney(month.expenses)}`}
                      />
                    </div>
                    <span>{month.label}</span>
                  </div>
                ))}
              </div>

              <div className="chart-legend">
                <span className="bookings">Bookings</span>
                <span className="income">Net income</span>
                <span className="expenses">Expenses</span>
              </div>
            </article>

            <article className="admin-erp-card category-card">
              <div className="admin-card-title">
                <PackageCheck size={19} strokeWidth={1.9} />
                <h2>Expense Split</h2>
              </div>

              {finance.expenseCategories.length === 0 ? (
                <p className="admin-muted">No expenses added yet.</p>
              ) : (
                <div className="category-bars">
                  {finance.expenseCategories.map((category) => (
                    <div className="category-row" key={category.category}>
                      <div>
                        <span>{category.category}</span>
                        <strong>{formatMoney(category.amount)}</strong>
                      </div>
                      <span className="category-track">
                        <span
                          style={{
                            width: `${Math.max(
                              6,
                              (category.amount / maxCategoryValue) * 100,
                            )}%`,
                          }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}

      {activeTab === "bookings" && (
        <section className="admin-erp-card admin-table-card">
          <div className="admin-card-title spaced">
            <div>
              <h2>All Bookings</h2>
              <p>{formatMoney(finance.totals.allBookings)} total booked value</p>
            </div>
            <span>{finance.bookings.length} orders</span>
          </div>

          <div className="admin-erp-table-wrap">
            <table className="admin-erp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {finance.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                      <strong>{booking.customer_name || "Customer"}</strong>
                      <span>{booking.customer_email || "--"}</span>
                      <span>{booking.customer_phone || "--"}</span>
                    </td>
                    <td>{formatDate(booking.created_at)}</td>
                    <td>{getBookingItems(booking) || "--"}</td>
                    <td>
                      <span className={`payment-pill ${booking.payment_status}`}>
                        {booking.payment_status || "--"}
                      </span>
                      <span>{booking.payment_id || "--"}</span>
                    </td>
                    <td>{formatMoney(booking.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "income" && (
        <>
          <section className="admin-erp-metrics income-breakdown">
            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <IndianRupee size={20} strokeWidth={1.9} />
              </span>
              <p>Total received</p>
              <strong>{formatMoney(finance.totals.paidIncome)}</strong>
              <small>Website net plus manual payments</small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <CreditCard size={20} strokeWidth={1.9} />
              </span>
              <p>Website net</p>
              <strong>{formatMoney(finance.totals.netOrderIncome)}</strong>
              <small>{formatMoney(finance.totals.grossOrderIncome)} gross</small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <ReceiptText size={20} strokeWidth={1.9} />
              </span>
              <p>Razorpay fees</p>
              <strong>{formatMoney(finance.totals.razorpayFees)}</strong>
              <small>2% cut from Razorpay orders</small>
            </article>

            <article className="admin-erp-card metric">
              <span className="metric-icon">
                <Wallet size={20} strokeWidth={1.9} />
              </span>
              <p>Manual income</p>
              <strong>{formatMoney(finance.totals.manualIncome)}</strong>
              <small>Stall, Meesho, Instagram, cash</small>
            </article>
          </section>

          <section className="admin-erp-grid income-grid">
            <article className="admin-erp-card income-form-card">
              <div className="admin-card-title">
                <Plus size={19} strokeWidth={1.9} />
                <h2>Add Payment Received</h2>
              </div>

              {!finance.incomeTableReady && (
                <p className="admin-erp-warning">Income storage needs setup.</p>
              )}

              <form className="money-form" onSubmit={submitIncome}>
                <label>
                  <span>Payment</span>
                  <input
                    value={incomeForm.title}
                    onChange={(event) =>
                      setIncomeForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="College stall, Meesho payout, etc."
                    disabled={!finance.incomeTableReady}
                    required
                  />
                </label>

                <label>
                  <span>Source</span>
                  <select
                    value={incomeForm.source}
                    onChange={(event) =>
                      setIncomeForm((current) => ({
                        ...current,
                        source: event.target.value,
                      }))
                    }
                    disabled={!finance.incomeTableReady}
                  >
                    {(finance.incomeSourceOptions.length
                      ? finance.incomeSourceOptions
                      : ["Stall", "Meesho", "Other"]
                    ).map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Amount</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={incomeForm.amount}
                    onChange={(event) =>
                      setIncomeForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="Amount"
                    disabled={!finance.incomeTableReady}
                    required
                  />
                </label>

                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={incomeForm.received_at}
                    onChange={(event) =>
                      setIncomeForm((current) => ({
                        ...current,
                        received_at: event.target.value,
                      }))
                    }
                    disabled={!finance.incomeTableReady}
                    required
                  />
                </label>

                <label className="money-note">
                  <span>Note</span>
                  <textarea
                    value={incomeForm.note}
                    onChange={(event) =>
                      setIncomeForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    disabled={!finance.incomeTableReady}
                  />
                </label>

                <button
                  type="submit"
                  className={`money-submit feedback-action is-${
                    incomeState === "success" ? "success" : incomeState
                  }`}
                  disabled={
                    !finance.incomeTableReady ||
                    incomeState !== "idle" ||
                    !incomeForm.title ||
                    !incomeForm.amount
                  }
                >
                  {incomeState === "loading" ? (
                    <>
                      <Loader2 size={16} className="admin-erp-spin" />
                      Saving
                    </>
                  ) : incomeState === "success" ? (
                    <>
                      <Check size={16} strokeWidth={2.2} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Plus size={16} strokeWidth={2} />
                      Add Payment
                    </>
                  )}
                </button>
              </form>
            </article>

            <article className="admin-erp-card income-list-card">
              <div className="admin-card-title spaced">
                <div>
                  <h2>Manual Payments</h2>
                  <p>{formatMoney(finance.totals.manualIncome)} added manually</p>
                </div>
                <CalendarDays size={18} strokeWidth={1.9} />
              </div>

              {finance.recentIncome.length === 0 ? (
                <p className="admin-muted">No manual payments recorded yet.</p>
              ) : (
                <div className="money-list">
                  {finance.recentIncome.map((income) => (
                    <div className="money-row" key={income.id}>
                      <div>
                        <strong>{income.title}</strong>
                        <span>
                          {income.source} - {formatDate(income.received_at)}
                        </span>
                        {income.note && <small>{income.note}</small>}
                      </div>
                      <div>
                        <b>{formatMoney(income.amount)}</b>
                        <button
                          type="button"
                          onClick={() => deleteIncome(income.id)}
                          disabled={deletingIncomeId === income.id}
                          aria-label={`Delete ${income.title}`}
                        >
                          {deletingIncomeId === income.id ? (
                            <Loader2 size={15} className="admin-erp-spin" />
                          ) : (
                            <Trash2 size={15} strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}

      {activeTab === "expenses" && (
        <section className="admin-erp-grid expenses-grid">
          <article className="admin-erp-card expense-form-card">
            <div className="admin-card-title">
              <Plus size={19} strokeWidth={1.9} />
              <h2>Add Expense</h2>
            </div>

            {!finance.expenseTableReady && (
              <p className="admin-erp-warning">Expense storage needs setup.</p>
            )}

            <form className="expense-form" onSubmit={submitExpense}>
              <label>
                <span>Expense</span>
                <input
                  value={expenseForm.title}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Raw beads, packaging, etc."
                  disabled={!finance.expenseTableReady}
                  required
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  disabled={!finance.expenseTableReady}
                >
                  {(finance.categories.length
                    ? finance.categories
                    : ["Raw Materials", "Packaging", "Other"]
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="Amount"
                  disabled={!finance.expenseTableReady}
                  required
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={expenseForm.spent_at}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      spent_at: event.target.value,
                    }))
                  }
                  disabled={!finance.expenseTableReady}
                  required
                />
              </label>

              <label className="expense-note">
                <span>Note</span>
                <textarea
                  value={expenseForm.note}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  disabled={!finance.expenseTableReady}
                />
              </label>

              <button
                type="submit"
                className={`expense-submit feedback-action is-${
                  expenseState === "success" ? "success" : expenseState
                }`}
                disabled={
                  !finance.expenseTableReady ||
                  expenseState !== "idle" ||
                  !expenseForm.title ||
                  !expenseForm.amount
                }
              >
                {expenseState === "loading" ? (
                  <>
                    <Loader2 size={16} className="admin-erp-spin" />
                    Saving
                  </>
                ) : expenseState === "success" ? (
                  <>
                    <Check size={16} strokeWidth={2.2} />
                    Saved
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2} />
                    Add Expense
                  </>
                )}
              </button>
            </form>
          </article>

          <article className="admin-erp-card expenses-list-card">
            <div className="admin-card-title spaced">
              <div>
                <h2>Expenses</h2>
                <p>{formatMoney(finance.totals.expenses)} total spend</p>
              </div>
              <CalendarDays size={18} strokeWidth={1.9} />
            </div>

            {finance.recentExpenses.length === 0 ? (
              <p className="admin-muted">No expenses recorded yet.</p>
            ) : (
              <div className="expense-list">
                {finance.recentExpenses.map((expense) => (
                  <div className="expense-row" key={expense.id}>
                    <div>
                      <strong>{expense.title}</strong>
                      <span>
                        {expense.category} - {formatDate(expense.spent_at)}
                      </span>
                      {expense.note && <small>{expense.note}</small>}
                    </div>
                    <div>
                      <b>{formatMoney(expense.amount)}</b>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        disabled={deletingExpenseId === expense.id}
                        aria-label={`Delete ${expense.title}`}
                      >
                        {deletingExpenseId === expense.id ? (
                          <Loader2 size={15} className="admin-erp-spin" />
                        ) : (
                          <Trash2 size={15} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
