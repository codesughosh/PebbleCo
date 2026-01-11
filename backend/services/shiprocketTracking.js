import axios from "axios";
import { getShiprocketToken } from "../shiprocket.js";

export async function getShiprocketTracking(awbCode) {
  const token = await getShiprocketToken();

  const response = await axios.get(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
