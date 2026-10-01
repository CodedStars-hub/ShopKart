require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

const sampleProducts = [
  {
    name: "Mechanical Gaming Keyboard",
    description: "RGB backlit mechanical keyboard with tactile blue switches, detachable USB-C braided cable, and anti-ghosting technology.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    stock: 15,
  },
  {
    name: "Noise-Cancelling Wireless Headphones",
    description: "Premium over-ear headphones with active noise cancellation, 40-hour battery life, and crystal-clear audio fidelity.",
    price: 6499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    stock: 8,
  },
  {
    name: "Smart Fitness Watch",
    description: "Water-resistant smartwatch featuring AMOLED display, 24/7 heart-rate tracking, SpO2 sensor, and 14-day battery life.",
    price: 3499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    stock: 12,
  },
  {
    name: "Classic Denim Jacket",
    description: "Timeless vintage wash denim jacket made from 100% organic cotton with button closure and relaxed modern fit.",
    price: 2199,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    stock: 20,
  },
  {
    name: "Minimalist Leather Backpack",
    description: "Handcrafted full-grain leather backpack featuring padded 15-inch laptop sleeve and water-resistant lining.",
    price: 4599,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    stock: 6,
  },
  {
    name: "The Pragmatic Programmer",
    description: "20th Anniversary Edition — your journey to mastery in software development and software architecture principles.",
    price: 1299,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    stock: 25,
  },
  {
    name: "Designing Data-Intensive Applications",
    description: "The big ideas behind reliable, scalable, and maintainable systems by Martin Kleppmann.",
    price: 1899,
    category: "Books",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
    stock: 18,
  },
  {
    name: "Ceramic Pour-Over Coffee Maker",
    description: "Artisan matte ceramic dripper set with heat-resistant borosilicate glass carafe for cafe-quality brew at home.",
    price: 1799,
    category: "Home",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
    stock: 10,
  },
  {
    name: "Aroma Diffuser & Humidifier",
    description: "Ultrasonic cool mist aromatherapy diffuser with 7 ambient LED colors and auto shut-off function.",
    price: 1499,
    category: "Home",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
    stock: 14,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const prod of sampleProducts) {
      const exists = await Product.findOne({ name: prod.name });
      if (!exists) {
        await Product.create(prod);
        console.log(`+ Seeded: ${prod.name}`);
      } else {
        console.log(`= Already exists: ${prod.name}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedProducts();
