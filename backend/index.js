// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ✅ Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ Explicitly resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS setup (RELIABLE)
const allowedOrigins = [
  "https://store.waldoch.com", // Shopify store (production)
  "https://waldoch-rebate-popup.onrender.com", // backend itself
  "http://localhost:3000", // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


// ✅ Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- SEND REBATE -------------------- */
app.post("/api/send-rebate", async (req, res) => {
  const { email, pdfUrl } = req.body;
  console.log(`[${new Date().toISOString()}] POST /api/send-rebate`);

  if (!email || !pdfUrl) {
    return res.status(400).json({ error: "Missing email or pdfUrl" });
  }

  let emailSent = false;
  let shopifySuccess = false;
  let shopifyData = null;

  // ✅ Send rebate email
  try {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Superwinch Rebate Form",
      html: `<p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
             <p>Print and complete it to claim your cash back.</p>
             <p>Thank you,<br>The Waldoch Team</p>
             <p style="margin-top:20px; text-align:center;">
               <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
                    alt="Waldoch Logo" style="max-width:200px; height:auto;">
             </p>`,
    });
    emailSent = true;
  } catch (err) {
    console.error("Email sending failed:", err);
    if (err.response) console.error("SendGrid error:", err.response.body);
  }

  // ✅ Shopify customer check/create
  try {
    const checkRes = await fetch(
      `https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/customers/search.json?query=email:${email}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
        },
      }
    );
    const existing = await checkRes.json();

    if (existing.customers && existing.customers.length > 0) {
      const existingCustomer = existing.customers[0];
      const currentTags = existingCustomer.tags
        ? existingCustomer.tags.split(",").map((t) => t.trim())
        : [];
      if (!currentTags.includes("rebate")) {
        const updatedTags = [...currentTags, "rebate"].join(",");
        const updateRes = await fetch(
          `https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/customers/${existingCustomer.id}.json`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
            },
            body: JSON.stringify({ customer: { tags: updatedTags } }),
          }
        );
        shopifyData = await updateRes.json();
        shopifySuccess = updateRes.ok;
      } else {
        shopifyData = existingCustomer;
        shopifySuccess = true;
      }
    } else {
      const createRes = await fetch(
        `https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/customers.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
          },
          body: JSON.stringify({
            customer: {
              email,
              first_name: "Rebate",
              last_name: "User",
              tags: "rebate",
              verified_email: true,
            },
          }),
        }
      );
      shopifyData = await createRes.json();
      shopifySuccess = createRes.ok;
    }
  } catch (err) {
    console.error("Shopify API error:", err);
  }

  res.json({ emailSent, shopifySuccess, shopifyData });
});

/* -------------------- REQUEST QUOTE -------------------- */
app.post("/api/quote", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    product_title,
    collection_handle,
    variant_id,
  } = req.body;

  console.log(`[${new Date().toISOString()}] POST /api/quote`, req.body);

  if (!first_name || !last_name || !email || !phone || !product_title) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email format" });
  if (!/^[0-9]{10,15}$/.test(phone))
    return res.status(400).json({ error: "Invalid phone number format" });

  try {
    await sgMail.send({
      to: process.env.SALES_EMAIL,
      from: process.env.EMAIL_FROM,
      subject: `Quote Request for ${product_title}`,
      html: `<h2>New Quote Request</h2>
             <p><strong>Product:</strong> ${product_title}</p>
             <p><strong>Variant ID:</strong> ${variant_id || "N/A"}</p>
             <p><strong>Collection:</strong> ${collection_handle || "N/A"}</p>
             <p><strong>Customer:</strong> ${first_name} ${last_name} | ${email} | ${phone}</p>`,
    });

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Your Quote Request Has Been Received",
      html: `<h2>Thank You</h2>
             <p>Dear ${first_name} ${last_name},</p>
             <p>We received your request for ${product_title}. Our sales team will contact you soon.</p>`,
    });

    res.json({ message: "Quote request submitted successfully!" });
  } catch (err) {
    console.error("Quote email sending failed:", err);
    res.status(500).json({ error: "Failed to send emails" });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 Waldoch rebate popup API running" });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`)
);
