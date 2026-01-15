import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

export async function sendOrderEmail({
  to,
  customerName,
  orderId,
  total,
  type, // "confirmed" | "shipped" | "delivered"
}) {

  const safeTotal =
  typeof total === "number"
    ? total.toFixed(2)
    : total
    ? Number(total).toFixed(2)
    : "—";

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  let subject = "Your PebbleCo order is confirmed";
  let message = `
Thank you for your order. We’ve received it successfully and are carefully preparing your handmade piece.
`;

  if (type === "shipped") {
    subject = "Your PebbleCo order is on the way";
    message = `
Great news! Your order has been shipped and is on its way to you.
`;
  }

  let deliveredBlock = "";

if (type === "delivered") {
  subject = "Your PebbleCo order has been delivered 💗";
  message = `
Your PebbleCo order has been delivered successfully. We truly hope it brought a smile to you.
`;

  deliveredBlock = `
  <tr>
    <td align="center" style="padding-top:22px;">
      <p style="
        font-size:15px;
        color:#3b2b2f;
        margin:0 0 10px;
        font-weight:500;
      ">
        ✨ Your order journey is complete ✨
      </p>

      <p style="
        font-size:13px;
        color:#8a6f75;
        margin:0;
        line-height:1.6;
      ">
        If you loved your PebbleCo piece, we’d be so happy if you shared your experience with us.
      </p>
    </td>
  </tr>
  `;
}


  await apiInstance.sendTransacEmail({
    sender: {
      name: "PebbleCo",
      email: "pebbleco.team@gmail.com",
    },
    to: [{ email: to, name: customerName }],
    subject: subject,
    htmlContent: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="
    margin:0;
    padding:0;
    background-color:#ffc1d3;
    font-family:'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  ">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">

          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width:560px;
            background:#fff7f8;
            border-radius:18px;
            padding:34px;
            box-shadow:0 18px 40px rgba(244,182,194,0.35);
          ">

            <!-- Brand -->
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <h1 style="
                  margin:0;
                  font-size:26px;
                  font-weight:600;
                  color:#3b2b2f;
                  letter-spacing:0.3px;
                ">
                  PebbleCo
                </h1>
                <p style="
                  margin:6px 0 0;
                  font-size:13px;
                  color:#8a6f75;
                ">
                  Thoughtfully handmade, just for you
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="border-top:1px solid #f9c6da; padding:22px 0;"></td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="
                font-size:15px;
                color:#3b2b2f;
                line-height:1.6;
              ">
                <p style="margin:0 0 14px;">
                  Hi ${customerName},
                </p>

                <p style="margin:0 0 18px;">
                  ${message}
                </p>
              </td>
            </tr>

            <!-- Order Info Box -->
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="
                  background:#ffffff;
                  border-radius:14px;
                  padding:18px 20px;
                  margin-top:10px;
                ">
                  <tr>
                    <td style="
                      font-size:14px;
                      color:#4a4a4a;
                      line-height:1.6;
                    ">
                      <p style="margin:0 0 6px;">
                        <strong>Order ID:</strong> ${orderId}
                      </p>
                      <p style="margin:0 0 6px;">
                        <strong>Total:</strong> ₹${safeTotal}
                      </p>
                      <p style="margin:0;">
                        <strong>Payment:</strong> Successful
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          ${deliveredBlock}
            <!-- Button -->
            <tr>
              <td align="center" style="padding-top:26px;">
                <a href="https://pebbleco.shop/track?orderId=${orderId}" style="
                  display:inline-block;
                  background:linear-gradient(135deg,#f4b6c2,#e89aa8);
                  color:#ffffff;
                  text-decoration:none;
                  font-size:14px;
                  font-weight:500;
                  padding:12px 26px;
                  border-radius:999px;
                ">
                  Track Your Order
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="border-top:1px solid #f9c6da; padding:26px 0;"></td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="
                font-size:12px;
                color:#8a6f75;
                line-height:1.6;
              ">
                <p style="margin:0;">
                  PebbleCo<br/>
                  Minimal • Cute • Handmade
                </p>
              </td>
            </tr>

          </table>
          <!-- End card -->

        </td>
      </tr>
    </table>
  </body>
</html>

`,
  });
}
