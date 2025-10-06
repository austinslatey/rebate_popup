import express from "express";
import { sendQuoteEmail } from "../services/emailService.js";
import { manageQuoteCustomer } from "../services/shopifyService.js";

const router = express.Router();

router.post("/quote", async (req, res) => {
  const { first_name, last_name, email, phone, product_title, collection_handle, variant_id } = req.body;

  if (!first_name || !last_name || !email || !phone || !product_title || !collection_handle) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let emailSent = false;
  let shopifySuccess = false;
  let shopifyData = null;

  emailSent = await sendQuoteEmail({ first_name, last_name, email, phone, product_title, collection_handle, variant_id });

  const { success, data } = await manageQuoteCustomer({ email, first_name, last_name, phone });

  shopifySuccess = success;
  shopifyData = data;

  if (emailSent && shopifySuccess) {
    res.json({ message: "Quote request processed successfully" });
  } else {
    res.status(500).json({
      error: "Failed to process quote request",
      emailSent,
      shopifySuccess,
      shopifyData,
    });
  }
});

export default router;