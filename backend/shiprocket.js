import axios from "axios";

let shiprocketToken = null;

export async function getShiprocketToken() {
  if (shiprocketToken) return shiprocketToken;

  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );

  shiprocketToken = response.data.token;
  return shiprocketToken;
}
