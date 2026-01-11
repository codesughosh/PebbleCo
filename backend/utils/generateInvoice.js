import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../assets/logo.png");

const drawWatermark = (doc) => {
  const { width, height } = doc.page;

  doc.save();
  doc.opacity(0.08); // tweak between 0.05–0.12

  doc.image(logoPath, width / 2 - 120, height / 2 - 120, {
    width: 240,
  });

  doc.restore();
};

export const generateInvoicePDF = ({
  orderId,
  paymentId,
  userEmail,
  items,
  total,
  deliveryType,
  shippingAddress,
  customerName,
  customerPhone,
}) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  drawWatermark(doc);

  /* ---------- FONT ---------- */
  doc.registerFont(
    "Poppins",
    path.join(__dirname, "../assets/Poppins-Regular.ttf")
  );

  let y = margin;

  /* ---------- HEADER ---------- */
  doc.rect(0, 0, pageWidth, 120).fill("#fdd2dc");

  doc
    .fillColor("#2b2b2b")
    .font("Poppins")
    .fontSize(28)
    .text("PebbleCo", margin, 40);

  doc
    .fontSize(11)
    .fillColor("#555")
    .text("Because details matter.", margin, 75);

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Payment ID: ${paymentId}`, pageWidth - 260, 55)
    .text(`Status: PAID`, pageWidth - 260, 70)
    .text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 260, 85);

  y = 150;

  /* ---------- BILL TO / SHIP TO ---------- */
  doc.fontSize(11).fillColor("#000");

  doc.text("Bill To:", margin, y);
  doc
    .fontSize(15)
    .fillColor("#2b2b2b")
    .text(
  deliveryType === "shipping"
    ? shippingAddress?.name || "N/A"
    : customerName || "N/A",
  margin,
  y + 15
);

if (deliveryType === "inhand" && customerPhone) {
  doc
    .fontSize(12)
    .fillColor("#2b2b2b")
    .text(`${customerPhone}`, margin, y + 40);
}



  doc
    .fontSize(11)
    .fillColor("#000")
    .text("Ship To:", pageWidth / 2, y);

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(
      deliveryType === "shipping"
        ? `${shippingAddress?.name}
${shippingAddress?.line1}
${shippingAddress?.city} - ${shippingAddress?.pincode}
${shippingAddress?.state}
Phone: ${shippingAddress?.phone}`
        : "In-Hand Delivery (SJCE, Mysore)",
      pageWidth / 2,
      y + 15
    );

  y += 110;

  /* ---------- TABLE HEADER ---------- */
  const drawTableHeader = () => {
    doc
      .fontSize(10)
      .fillColor("#000")
      .text("Product", margin, y)
      .text("Qty", 320, y)
      .text("Rate", 380, y)
      .text("Amount", 450, y);

    y += 15;

    doc
      .moveTo(margin, y)
      .lineTo(pageWidth - margin, y)
      .strokeColor("#ddd")
      .stroke();

    y += 10;
  };

  drawTableHeader();

  /* ---------- ITEMS ---------- */
  items.forEach((item) => {
    if (y > pageHeight - 180) {
      doc.addPage();
      drawWatermark(doc);
      y = margin;
      drawTableHeader();
    }

    doc
      .fontSize(10)
      .fillColor("#555")
      .text(item.name, margin, y)
      .text(item.quantity.toString(), 320, y)
      .text(`₹${item.price_at_purchase}`, 380, y)
      .text(`₹${item.price_at_purchase * item.quantity}`, 450, y);

    y += 20;
  });

  if (deliveryType === "shipping") {
  if (y > pageHeight - 180) {
    doc.addPage();
    y = margin;
    drawTableHeader();
  }

  doc
    .fontSize(10)
    .fillColor("#555")
    .text("Shipping Fee", margin, y)
    .text("-", 320, y, { width: 40, align: "left" })   // Qty
    .text("-", 380, y, { width: 50, align: "left" })   // Rate
    .text("₹60", 450, y, { width: 80, align: "left" }); // Amount

  y += 20;
}


  /* ---------- TOTAL ---------- */
  if (y > pageHeight - 160) {
    doc.addPage();
    drawWatermark(doc);
    y = margin;
  }

  y += 20;

  doc.rect(pageWidth - 260, y, 210, 60).fill("#fceae4");

  doc
    .fillColor("#000")
    .fontSize(12)
    .text("Total Paid", pageWidth - 185, y + 10);

  doc.fontSize(18).text(`₹${total}`, pageWidth - 180, y + 30);

  y += 90;

  /* ---------- NOTES ---------- */
  if (y > pageHeight - 100) {
    doc.addPage();
    drawWatermark(doc);
    y = margin;
  }

  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      `Notes:
• All products are handmade; slight variations may occur.
• No returns. Replacement only for damaged items within 24 hours.
• Unboxing video mandatory for replacement.
• Orders cannot be cancelled once placed.
• Delivery: 2–7 business days.`,
      margin,
      y
    );

  /* ---------- FOOTER ---------- */
  y += 90;
  doc
    .fontSize(9)
    .fillColor("#777")
    .text("Thank you for shopping with PebbleCo", margin, y, {
      align: "center",
      width: pageWidth - margin * 2,
    });

  y += 15;

  doc.text("Handcrafted • Minimal • Made in India", margin, y, {
    align: "center",
    width: pageWidth - margin * 2,
  });

  doc.end();
  return doc;
};
