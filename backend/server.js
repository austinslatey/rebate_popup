import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();

app.use(cors({
  origin: "*", // you can also whitelist your Shopify domain
  methods: ["GET", "POST"],
}));
app.use(express.json());

app.post("/api/send-rebate", async (req, res) => {
  const { email, pdfUrl } = req.body;

  if (!email || !pdfUrl) {
    return res.status(400).json({ error: "Missing email or pdfUrl" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.sendgrid.net",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Superwinch Rebates" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Superwinch Rebate Form",
      html: `<p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
             <p>Print and complete it to claim your cash back.</p>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
