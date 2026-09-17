require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const customerRoutes = require("./routes/customer.routes");

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Middleware to parse incoming cookies from request headers
app.use(cookieParser());

// Mount customer authentication routes under /customers
app.use("/customers", customerRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "ShopKart Customer Authentication Service is running" });
});

// Port configuration
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";

// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = app;
