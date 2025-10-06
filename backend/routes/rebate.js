import express from "express";
import { sendRebateEmail } from "../services/emailService.js";
import { manageRebateCustomer } from "../services/shopifyService.js";

const router = express.Router();

router.post("/send-rebate", async (req, res) => {
    const { email, pdfUrl } = req.body;

    if (!email || !pdfUrl) {
        return res.status(400).json({ error: "Missing email or pdfUrl" });
    }

    const emailSent = await sendRebateEmail(email, pdfUrl);
    const { success: shopifySuccess, data: shopifyData } = await manageRebateCustomer(email);

    res.json({
        emailSent,
        shopifySuccess,
        shopifyData,
    });
});

export default router;