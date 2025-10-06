import sgMail from "@sendgrid/mail";

const WALDOCH_LOGO = `
    <p style="margin-top:20px; text-align:center;">
        <img src="https://www.waldoch.com/wp-content/uploads/2021/02/logo-wo-w-50th-314-86-1.png"
            alt="Waldoch Logo" style="max-width:200px; height:auto;">
    </p>`;

export async function sendRebateEmail(email, pdfUrl) {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("Error: SENDGRID_API_KEY is missing!");
        return false;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        const msg = {
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Superwinch Rebate Form",
            html: `
                <p>Download your rebate form here: <a href="${pdfUrl}">${pdfUrl}</a></p>
                <p>Print and complete it to claim your cash back.</p>
                <p>Thank you,</p>
                <p>The Waldoch Team</p>
                ${WALDOCH_LOGO}`,
        };
        await sgMail.send(msg);
        return true;
    } catch (err) {
        console.error("Email sending failed:", err.message);
        if (err.response) {
            console.error("SendGrid error response:", err.response.body);
        }
        return false;
    }
}

export async function sendQuoteEmail({ first_name, last_name, email, phone, product_title, collection_handle }) {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("Error: SENDGRID_API_KEY is missing!");
        return false;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        const msg = {
            to: process.env.QUOTE_EMAIL_TO || "quotes@yourstore.com",
            from: process.env.EMAIL_FROM,
            subject: `Quote Request for ${product_title}`,
            html: `
                <p>New Quote Request</p>
                <ul>
                    <li><strong>First Name:</strong> ${first_name}</li>
                    <li><strong>Last Name:</strong> ${last_name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Phone:</strong> ${phone}</li>
                    <li><strong>Product:</strong> ${product_title}</li>
                    <li><strong>Collection:</strong> ${collection_handle}</li>
                </ul>
                <p>Thank you,</p>
                <p>The Waldoch Team</p>
                ${WALDOCH_LOGO}`,
        };
        await sgMail.send(msg);
        return true;
    } catch (err) {
        console.error("Quote email sending failed:", err.message);
        if (err.response) {
            console.error("SendGrid error response:", err.response.body);
        }
        return false;
    }
}