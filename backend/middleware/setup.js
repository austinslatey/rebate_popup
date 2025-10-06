import cors from "cors";
import express from "express";

export default function setupMiddleware(app) {
  // Enable CORS with environment variables for origins
  app.use(
    cors({
      origin: [
        process.env.SHOPIFY_SHOP,
        process.env.SHOPIFY_SHOP1,
      ],
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Explicitly handle preflight OPTIONS requests
  app.options(
    "*",
    cors({
      origin: [
        process.env.SHOPIFY_SHOP,
        process.env.SHOPIFY_SHOP1,
      ],
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Parse JSON bodies
  app.use(express.json());
}