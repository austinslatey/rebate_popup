import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import setupMiddleware from "./middleware/setup.js";
import rebateRoutes from "./routes/rebate.js";
import quoteRoutes from "./routes/quote.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

const app = express();
setupMiddleware(app);
app.use("/api", rebateRoutes);
app.use("/api", quoteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));