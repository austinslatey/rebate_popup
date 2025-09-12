import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Load from .env
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const API_TOKEN = process.env.SHOPIFY_API_TOKEN;
const PORT = process.env.PORT || 3000;

// Route for capturing emails
app.post("/rebate-capture", async (req, res) => {
  const { email } = req.body;

  try {
    const response = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2025-07/customers.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            email,
            tags: "Rebate Form",
          },
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      res.json({ success: true, customer: result.customer });
    } else {
      res.status(response.status).json({ success: false, error: result.errors });
    }
  } catch (err) {
    console.error("Error saving customer:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
