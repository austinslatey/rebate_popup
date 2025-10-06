import fetch from "node-fetch";

const SHOPIFY_API_BASE = `https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07`;
const HEADERS = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
};

export async function manageRebateCustomer(email) {
    try {
        const checkRes = await fetch(
            `${SHOPIFY_API_BASE}/customers/search.json?query=email:${email}`,
            { headers: HEADERS }
        );
        const existing = await checkRes.json();

        if (existing.customers && existing.customers.length > 0) {
            const existingCustomer = existing.customers[0];
            console.log("Customer already exists in Shopify:", existingCustomer.id);

            const currentTags = existingCustomer.tags ? existingCustomer.tags.split(",").map(t => t.trim()) : [];
            if (!currentTags.includes("rebate")) {
                const updatedTags = [...currentTags, "rebate"].join(",");
                const updateRes = await fetch(
                    `${SHOPIFY_API_BASE}/customers/${existingCustomer.id}.json`,
                    {
                        method: "PUT",
                        headers: HEADERS,
                        body: JSON.stringify({ customer: { tags: updatedTags } }),
                    }
                );
                const shopifyData = await updateRes.json();
                return { success: updateRes.ok, data: shopifyData };
            }
            return { success: true, data: existingCustomer };
        } else {
            const createRes = await fetch(
                `${SHOPIFY_API_BASE}/customers.json`,
                {
                    method: "POST",
                    headers: HEADERS,
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
            const shopifyData = await createRes.json();
            return { success: createRes.ok, data: shopifyData };
        }
    } catch (err) {
        console.error("Shopify API error:", err);
        return { success: false, data: null };
    }
}

export async function manageQuoteCustomer({ email, first_name, last_name, phone }) {
    try {
        const checkRes = await fetch(
            `${SHOPIFY_API_BASE}/customers/search.json?query=email:${email}`,
            { headers: HEADERS }
        );
        const existing = await checkRes.json();

        if (existing.customers && existing.customers.length > 0) {
            const existingCustomer = existing.customers[0];
            console.log("Customer already exists in Shopify:", existingCustomer.id);

            const currentTags = existingCustomer.tags ? existingCustomer.tags.split(",").map(t => t.trim()) : [];
            if (!currentTags.includes("quote-request")) {
                const updatedTags = [...currentTags, "quote-request"].join(",");
                const updateRes = await fetch(
                    `${SHOPIFY_API_BASE}/customers/${existingCustomer.id}.json`,
                    {
                        method: "PUT",
                        headers: HEADERS,
                        body: JSON.stringify({
                            customer: {
                                tags: updatedTags,
                                first_name,
                                last_name
                            }
                        }),
                    }
                );
                const shopifyData = await updateRes.json();
                return { success: updateRes.ok, data: shopifyData };
            }
            return { success: true, data: existingCustomer };
        } else {
            const createRes = await fetch(
                `${SHOPIFY_API_BASE}/customers.json`,
                {
                    method: "POST",
                    headers: HEADERS,
                    body: JSON.stringify({
                        customer: {
                            email,
                            first_name,
                            last_name,
                            phone,
                            tags: "quote-request",
                            verified_email: true,
                        },
                    }),
                }
            );
            const shopifyData = await createRes.json();
            return { success: createRes.ok, data: shopifyData };
        }
    } catch (err) {
        console.error("Shopify API error:", err);
        return { success: false, data: null };
    }
}