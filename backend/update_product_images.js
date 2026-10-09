require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

// Curated high-resolution, verified Unsplash image mappings matching product names and categories
const IMAGE_MAPPINGS = [
  {
    matcher: /keyboard/i,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    matcher: /mouse/i,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    matcher: /headphone/i,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    matcher: /watch/i,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    matcher: /jacket|denim/i,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    category: "Fashion",
  },
  {
    matcher: /backpack|leather/i,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    category: "Fashion",
  },
  {
    matcher: /pragmatic programmer/i,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    category: "Books",
  },
  {
    matcher: /data-intensive/i,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
    category: "Books",
  },
  {
    matcher: /handbook|book/i,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    category: "Books",
  },
  {
    matcher: /coffee/i,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
    category: "Home",
  },
  {
    matcher: /diffuser|humidifier/i,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
    category: "Home",
  },
  {
    matcher: /gadget/i,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
];

async function updateProductImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for product image synchronization...");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to evaluate.`);

    let updatedCount = 0;

    for (const prod of products) {
      let matched = null;
      for (const m of IMAGE_MAPPINGS) {
        if (m.matcher.test(prod.name)) {
          matched = m;
          break;
        }
      }

      if (!matched) {
        if (prod.category === "Books") {
          matched = { image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80" };
        } else if (prod.category === "Fashion") {
          matched = { image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80" };
        } else if (prod.category === "Home") {
          matched = { image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80" };
        } else {
          matched = { image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80" };
        }
      }

      if (prod.image !== matched.image) {
        prod.image = matched.image;
        await prod.save();
        updatedCount++;
        console.log(`✓ Updated [${prod.name}] -> ${matched.image.slice(0, 50)}...`);
      }
    }

    console.log(`\nSynchronization complete! Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to update product images:", err);
    process.exit(1);
  }
}

updateProductImages();
