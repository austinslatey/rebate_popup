import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

dotenv.config();
const app = express();

app.use(cors({
    origin: "*", // or restrict to Shopify domain
    methods: ["GET", "POST"],
}));
app.use(express.json());

app.post("/api/send-rebate", async (req, res) => {
    const { email, pdfUrl } = req.body;

    if (!email || !pdfUrl) {
        return res.status(400).json({ error: "Missing email or pdfUrl" });
    }

    let emailSent = false;
    let shopifySuccess = false;
    let shopifyData = null;

    // 1️⃣ Send rebate email
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Superwinch Rebates" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Superwinch Rebate Form",
            html: `<p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
             <p>Print and complete it to claim your cash back.</p>
             <p>Thank you,</p>
             <p>The Waldoch Team</p>
             <p style="margin-top:20px; text-align:center;">
               <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
                 alt="Waldoch Logo" style="max-width:200px; height:auto;">
             </p>`,
        });

        emailSent = true;
    } catch (err) {
        console.error("Email sending failed:", err);
    }

    // 2️⃣ Check if Shopify customer exists
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
            // Customer exists → optionally update tags
            const existingCustomer = existing.customers[0];
            console.log("Customer already exists in Shopify:", existingCustomer.id);

            // Optional: Add 'rebate' tag if not present
            const currentTags = existingCustomer.tags ? existingCustomer.tags.split(",").map(t => t.trim()) : [];
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
                shopifySuccess = true;
                shopifyData = existingCustomer;
            }

        } else {
            // Customer does not exist → create new
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
                            email: email,
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

    // 3️⃣ Respond with status for each step
    res.json({
        emailSent,
        shopifySuccess,
        shopifyData,
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
