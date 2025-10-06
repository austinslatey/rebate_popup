import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import fetch from "node-fetch";

dotenv.config();
const app = express();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Use cors middleware to handle all CORS (including OPTIONS) automatically
app.use(cors({
    origin: "*", // Matches older working code
    methods: ["GET", "POST"], // cors package handles OPTIONS implicitly
    allowedHeaders: ["Content-Type"],
    credentials: false
}));

// Minimal logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from origin: ${req.get('Origin') || 'unknown'}`);
    next();
});

app.use(express.json());

app.post("/api/send-rebate", async (req, res) => {
    const { email, pdfUrl } = req.body;

    if (!email || !pdfUrl) {
        return res.status(400).json({ error: "Missing email or pdfUrl" });
    }

    let emailSent = false;
    let shopifySuccess = false;
    let shopifyData = null;

    try {
        const msg = {
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Superwinch Rebate Form",
            html: `<p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
                   <p>Print and complete it to claim your cash back.</p>
                   <p>Thank you,</p>
                   <p>The Waldoch Team</p>
                   <p style="margin-top:20px; text-align:center;">
                     <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
                       alt="Waldoch Logo" style="max-width:200px; height:auto;">
                   </p>`,
        };

        await sgMail.send(msg);
        emailSent = true;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Email sending failed:`, err);
        if (err.response) {
            console.error("SendGrid error response:", err.response.body);
        }
    }

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
            console.log("Customer already exists in Shopify:", existingCustomer.id);

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
        console.error(`[${new Date().toISOString()}] Shopify API error:`, err);
    }

    res.json({
        emailSent,
        shopifySuccess,
        shopifyData,
    });
});

app.post("/api/quote", async (req, res) => {
    const { first_name, last_name, email, phone, product_title, collection_handle, variant_id } = req.body;

    console.log(`[${new Date().toISOString()}] POST /api/quote payload:`, JSON.stringify(req.body));

    if (!first_name || !last_name || !email || !phone || !product_title) {
        console.log(`[${new Date().toISOString()}] Missing required fields:`, { first_name, last_name, email, phone, product_title });
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log(`[${new Date().toISOString()}] Invalid email format: ${email}`);
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (!/^[0-9]{10,15}$/.test(phone)) {
        console.log(`[${new Date().toISOString()}] Invalid phone format: ${phone}`);
        return res.status(400).json({ error: "Invalid phone number format" });
    }

    let salesEmailSent = false;
    let confirmationEmailSent = false;

    try {
        const salesMsg = {
            to: process.env.SALES_EMAIL,
            from: process.env.EMAIL_FROM,
            subject: `Quote Request for ${product_title}`,
            html: `
                <h2>New Quote Request</h2>
                <p><strong>Product:</strong> ${product_title}</p>
                <p><strong>Variant ID:</strong> ${variant_id || 'N/A'}</p>
                <p><strong>Collection:</strong> ${collection_handle || 'N/A'}</p>
                <p><strong>Customer Details:</strong></p>
                <ul>
                    <li><strong>Name:</strong> ${first_name} ${last_name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Phone:</strong> ${phone}</li>
                </ul>
                <p>Please follow up with the customer to provide the requested quote.</p>
                <p style="margin-top:20px; text-align:center;">
                    <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
                        alt="Waldoch Logo" style="max-width:200px; height:auto;">
                </p>
            `,
        };

        console.log(`[${new Date().toISOString()}] Sending sales email to ${process.env.SALES_EMAIL}`);
        await sgMail.send(salesMsg);
        salesEmailSent = true;

        const confirmationMsg = {
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Your Quote Request Has Been Received",
            html: `
                <h2>Thank You for Your Quote Request</h2>
                <p>Dear ${first_name} ${last_name},</p>
                <p>We have received your request for a quote on the following product:</p>
                <p><strong>Product:</strong> ${product_title}</p>
                <p><strong>Collection:</strong> ${collection_handle || 'N/A'}</p>
                <p>Our sales team will review your request and get back to you soon with a quote.</p>
                <p>If you have any questions, feel free to contact us at ${process.env.SALES_EMAIL}.</p>
                <p>Thank you for choosing Waldoch!</p>
                <p style="margin-top:20px; text-align:center;">
                    <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
                        alt="Waldoch Logo" style="max-width:200px; height:auto;">
                </p>
            `,
        };

        console.log(`[${new Date().toISOString()}] Sending confirmation email to ${email}`);
        await sgMail.send(confirmationMsg);
        confirmationEmailSent = true;

        console.log(`[${new Date().toISOString()}] Quote request processed successfully`);
        res.json({
            message: "Quote request submitted successfully!",
            salesEmailSent,
            confirmationEmailSent,
        });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Email sending failed:`, err);
        if (err.response) {
            console.error("SendGrid error response:", err.response.body);
        }
        res.status(500).json({ 
            error: "Failed to send emails",
            salesEmailSent,
            confirmationEmailSent
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`));