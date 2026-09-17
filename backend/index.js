require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const customerRoutes = require("./routes/customer.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ShopKart Customer Authentication Service is running" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";

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
