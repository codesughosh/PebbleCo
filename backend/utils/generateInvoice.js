import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = ({
  orderId,
  paymentId,
  userEmail,
  items,
  total,
}) => {
  const doc = new PDFDocument({ margin: 40 });
  const pageWidth = doc.page.width;

  /* ---------- REGISTER FONT ---------- */
  const poppinsPath = path.join(
    __dirname,
    "../assets/Poppins-Regular.ttf"
  );
  doc.registerFont("Poppins", poppinsPath);

  /* ---------- HEADER BACKGROUND ---------- */
  doc
    .rect(0, 0, pageWidth, 140)
    .fill("#fdd2dc");

  /* ---------- LOGO ---------- */
  const logoPath = path.join(__dirname, "../assets/logo.png");
  doc.image(logoPath, 40, 30, { width: 60 });

  /* ---------- BIG BRAND TITLE ---------- */
  doc
    .font("Poppins")
    .fillColor("#333")
    .fontSize(36)
    .text("PebbleCo", 0, 40, {
      align: "center",
    });

  doc
    .fontSize(12)
    .fillColor("#555")
    .text("Handmade with love ✨", 0, 85, {
      align: "center",
    });

  /* ---------- INVOICE META ---------- */
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Invoice ID: PC-${orderId}`, pageWidth - 240, 40)
    .text(`Payment ID: ${paymentId}`, pageWidth - 240, 55)
    .text(`Status: PAID`, pageWidth - 240, 70)
    .text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth - 240,
      85
    );

  /* ---------- CUSTOMER INFO ---------- */
  doc
    .moveDown(7)
    .fontSize(12)
    .fillColor("#333")
    .text("Billed To");

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(userEmail);

  /* ---------- DIVIDER ---------- */
  doc
    .moveDown(1)
    .moveTo(40, doc.y)
    .lineTo(pageWidth - 40, doc.y)
    .strokeColor("#e0e0e0")
    .stroke();

  /* ---------- ITEMS TABLE ---------- */
  let y = doc.y + 20;

  doc
    .fontSize(11)
    .fillColor("#333")
    .text("Item", 40, y)
    .text("Qty", 300, y)
    .text("Price", 360, y)
    .text("Total", 440, y);

  y += 15;

  doc
    .moveTo(40, y)
    .lineTo(pageWidth - 40, y)
    .strokeColor("#e0e0e0")
    .stroke();

  y += 10;

  items.forEach((item) => {
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(item.name, 40, y)
      .text(item.quantity.toString(), 300, y)
      .text(`₹${item.price}`, 360, y)
      .text(`₹${item.price * item.quantity}`, 440, y);

    y += 20;
  });

  /* ---------- TOTAL BOX ---------- */
  y += 20;

  doc
    .rect(pageWidth - 260, y, 220, 60)
    .fill("#fceae4");

  doc
    .fillColor("#333")
    .fontSize(14)
    .text("Total Paid", pageWidth - 240, y + 12);

  doc
    .fontSize(20)
    .text(`₹${total}`, pageWidth - 240, y + 32);

  /* ---------- FOOTER ---------- */
  doc
    .fontSize(9)
    .fillColor("#777")
    .text(
      "Thank you for supporting PebbleCo 💗",
      40,
      doc.page.height - 90,
      { align: "center", width: pageWidth - 80 }
    );

  doc
    .text(
      "Handcrafted • Minimal • Made in India",
      40,
      doc.page.height - 70,
      { align: "center", width: pageWidth - 80 }
    );

  doc.end();
  return doc;
};
