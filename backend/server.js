import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import fetch from "node-fetch"; // native fetch works in Node 18+, but safe to import

dotenv.config();
const app = express();

app.use(cors({
  origin: "*", // you can restrict to your Shopify domain
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Send rebate email + create Shopify customer
app.post("/api/send-rebate", async (req, res) => {
  const { email, pdfUrl } = req.body;

  if (!email || !pdfUrl) {
    return res.status(400).json({ error: "Missing email or pdfUrl" });
  }

  try {
    // === 1️⃣ Send rebate email ===
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER, // 'apikey'
        pass: process.env.EMAIL_PASS, // SendGrid API key
      },
    });

    await transporter.sendMail({
      from: `"Superwinch Rebates" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Superwinch Rebate Form",
      html: `<p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
             <p>Print and complete it to claim your cash back.</p>`,
    });

    // === 2️⃣ Add customer to Shopify ===
    const shopifyResponse = await fetch(`https://${process.env.SHOPIFY_SHOP}.myshopify.com/admin/api/2025-07/customers.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        customer: {
          email: email,
          first_name: "Rebate",
          last_name: "User",
          tags: "rebate",
          verified_email: true,
        },
      }),
    });

    const shopifyData = await shopifyResponse.json();

    if (!shopifyResponse.ok) {
      console.error("Shopify error:", shopifyData);
      return res.status(500).json({ error: "Failed to create Shopify customer" });
    }

    res.json({ success: true, shopifyData });
  } catch (err) {
    console.error("Error sending rebate or creating customer:", err);
    res.status(500).json({ error: "Failed to send rebate or create customer" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
