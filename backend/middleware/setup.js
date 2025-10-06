import cors from "cors";
import express from "express";

export default function setupMiddleware(app) {
    app.use(cors({
        origin: process.env.SHOPIFY_SHOP || "https://yourstore.myshopify.com",
        methods: ["GET", "POST"],
    }));
    app.use(express.json());
}