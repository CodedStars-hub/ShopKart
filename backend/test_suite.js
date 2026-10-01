require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./index");

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING SHOPKART BACKEND AUTOMATED TEST SUITE");
  console.log("==================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5002, resolve));
  const BASE_URL = "http://localhost:5002";
  console.log(`Test server running at ${BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    const timestamp = Date.now();
    const user1Email = `user1_${timestamp}@shopkart.test`;
    const user2Email = `user2_${timestamp}@shopkart.test`;

    // --------------------------------------------------
    // LAB 01 VERIFICATION
    // --------------------------------------------------
    console.log("--- LAB 01 & AUTH VERIFICATION ---");

    // 1. Register User 1
    const regRes1 = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User One",
        email: user1Email,
        password: "password123",
        phone: "9876543210",
      }),
    });
    const regData1 = await regRes1.json();
    assert(regRes1.status === 201, "User 1 registration returns 201");
    assert(regData1.success === true, "User 1 registration success is true");
    assert(!regData1.customer?.password, "Password is not exposed in registration");

    // 2. Duplicate Registration
    const dupRes = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate User",
        email: user1Email,
        password: "password123",
        phone: "9876543210",
      }),
    });
    assert(dupRes.status === 409, "Duplicate registration returns 409 Conflict");

    // 3. Register User 2 (for isolation testing)
    await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User Two",
        email: user2Email,
        password: "password123",
        phone: "9123456780",
      }),
    });

    // 4. Login User 1
    const loginRes1 = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user1Email, password: "password123" }),
    });
    assert(loginRes1.status === 200, "User 1 login returns 200 OK");
    const rawCookie1 = loginRes1.headers.get("set-cookie");
    assert(Boolean(rawCookie1 && rawCookie1.includes("token=")), "Login sets token cookie");
    const cookieHeader1 = rawCookie1.split(";")[0];

    // 5. Login User 2
    const loginRes2 = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user2Email, password: "password123" }),
    });
    const cookieHeader2 = loginRes2.headers.get("set-cookie").split(";")[0];

    // 6. Verify Profile via GET /customers/me
    const meRes1 = await fetch(`${BASE_URL}/customers/me`, {
      headers: { Cookie: cookieHeader1 },
    });
    const meData1 = await meRes1.json();
    assert(meRes1.status === 200, "GET /customers/me returns 200 with cookie");
    assert(meData1.email === user1Email, "GET /customers/me returns authenticated customer");

    // 7. GET /customers/me without cookie
    const meUnauth = await fetch(`${BASE_URL}/customers/me`);
    assert(meUnauth.status === 401, "GET /customers/me without cookie returns 401");

    // --------------------------------------------------
    // LAB 03 VERIFICATION
    // --------------------------------------------------
    console.log("\n--- LAB 03: PRODUCT CATALOG & DISCOVERY TESTS ---");

    // Test 1: POST /products (valid)
    const productPayload = {
      name: `Mechanical Keyboard ${timestamp}`,
      description: "RGB mechanical keyboard with blue switches.",
      price: 2999,
      category: "Electronics",
      image: "https://example.com/keyboard.jpg",
      stock: 10,
    };
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productPayload),
    });
    const createProdData = await createProdRes.json();
    assert(createProdRes.status === 201, "Test 1: POST /products returns 201 Created");
    assert(createProdData.product?.name === productPayload.name, "Test 1: Created product has correct name");
    const createdProductId = createProdData.product._id;

    // Create a 2nd product in Books category
    const createBookRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `JavaScript Handbook ${timestamp}`,
        description: "The complete guide to modern JavaScript.",
        price: 799,
        category: "Books",
        image: "https://example.com/book.jpg",
        stock: 25,
      }),
    });
    const bookData = await createBookRes.json();
    const bookProductId = bookData.product._id;

    // Test 2: GET /products
    const getAllRes = await fetch(`${BASE_URL}/products`);
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, "Test 2: GET /products returns 200 OK");
    assert(getAllData.success === true, "Test 2: GET /products success is true");
    assert(Array.isArray(getAllData.products), "Test 2: GET /products returns array of products");
    assert(typeof getAllData.count === "number", "Test 2: GET /products returns count");

    // Test 3: GET /products/:id
    const getSingleRes = await fetch(`${BASE_URL}/products/${createdProductId}`);
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200, "Test 3: GET /products/:id returns 200");
    assert(getSingleData.product._id === createdProductId, "Test 3: Single product matches requested ID");

    // Test 4: GET /products/invalid-id
    const invalidIdRes = await fetch(`${BASE_URL}/products/123invalid`);
    assert(invalidIdRes.status === 400, "Test 4: Invalid MongoDB ObjectId returns 400");

    // Test 5: GET /products/:nonexistentId
    const nonExistentRes = await fetch(`${BASE_URL}/products/66d000000000000000000000`);
    assert(nonExistentRes.status === 404, "Test 5: Nonexistent product returns 404");

    // Test 6: Search (case-insensitive partial match)
    const searchRes = await fetch(`${BASE_URL}/products?search=keyboard`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, "Test 6: Search returns 200");
    assert(
      searchData.products.some((p) => p._id === createdProductId),
      "Test 6: 'keyboard' search finds Mechanical Keyboard"
    );

    // Test 7: Category filter
    const catRes = await fetch(`${BASE_URL}/products?category=Books`);
    const catData = await catRes.json();
    assert(catRes.status === 200, "Test 7: Category filter returns 200");
    assert(
      catData.products.every((p) => p.category.toLowerCase() === "books"),
      "Test 7: All returned products match 'Books' category"
    );

    // Test 8: Combined search + category
    const combRes = await fetch(
      `${BASE_URL}/products?search=Mechanical&category=Electronics`
    );
    const combData = await combRes.json();
    assert(combRes.status === 200, "Test 8: Combined search + category returns 200");
    assert(
      combData.products.some((p) => p._id === createdProductId),
      "Test 8: Combined filter matches expected product"
    );

    // Test 9: Invalid price (<= 0 or NaN)
    const badPriceRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productPayload, price: -5 }),
    });
    assert(badPriceRes.status === 400, "Test 9: Invalid price <= 0 returns 400");

    // Test 10: Invalid stock (< 0 or not integer)
    const badStockRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productPayload, stock: -1 }),
    });
    assert(badStockRes.status === 400, "Test 10: Invalid negative stock returns 400");

    // Test 11: Missing required field
    const missingFieldRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Incomplete Product" }),
    });
    assert(missingFieldRes.status === 400, "Test 11: Missing required fields returns 400");

    // --------------------------------------------------
    // LAB 04 VERIFICATION
    // --------------------------------------------------
    console.log("\n--- LAB 04: WISHLIST TESTS ---");

    // Test 1: POST /wishlist/:productId (User 1 adds product)
    const addWishRes1 = await fetch(`${BASE_URL}/wishlist/${createdProductId}`, {
      method: "POST",
      headers: { Cookie: cookieHeader1 },
    });
    const addWishData1 = await addWishRes1.json();
    assert(addWishRes1.status === 200, "Test 1: POST /wishlist/:productId returns 200 success");
    assert(addWishData1.success === true, "Test 1: Wishlist add response success is true");

    // Test 2: POST same product again -> 409 Conflict
    const dupWishRes = await fetch(`${BASE_URL}/wishlist/${createdProductId}`, {
      method: "POST",
      headers: { Cookie: cookieHeader1 },
    });
    assert(dupWishRes.status === 409, "Test 2: Adding duplicate product to wishlist returns 409 Conflict");

    // Test 3: GET /wishlist -> populated wishlist products
    const getWishRes1 = await fetch(`${BASE_URL}/wishlist`, {
      headers: { Cookie: cookieHeader1 },
    });
    const getWishData1 = await getWishRes1.json();
    assert(getWishRes1.status === 200, "Test 3: GET /wishlist returns 200");
    assert(getWishData1.count === 1, "Test 3: Wishlist count is 1");
    assert(getWishData1.wishlist[0]._id === createdProductId, "Test 3: Wishlist contains added product");
    assert(Boolean(getWishData1.wishlist[0].name), "Test 3: Wishlist item is populated with name");
    assert(Boolean(getWishData1.wishlist[0].price), "Test 3: Wishlist item is populated with price");

    // Test 4: DELETE /wishlist/:productId
    const delWishRes = await fetch(`${BASE_URL}/wishlist/${createdProductId}`, {
      method: "DELETE",
      headers: { Cookie: cookieHeader1 },
    });
    const delWishData = await delWishRes.json();
    assert(delWishRes.status === 200, "Test 4: DELETE /wishlist/:productId returns 200");
    assert(delWishData.success === true, "Test 4: Wishlist removal response success is true");

    // Test 5: DELETE same product again -> 404
    const delAgainRes = await fetch(`${BASE_URL}/wishlist/${createdProductId}`, {
      method: "DELETE",
      headers: { Cookie: cookieHeader1 },
    });
    assert(delAgainRes.status === 404, "Test 5: Removing item not in wishlist returns 404");

    // Test 6: Invalid product ID
    const badProdWishRes = await fetch(`${BASE_URL}/wishlist/invalid-id-xyz`, {
      method: "POST",
      headers: { Cookie: cookieHeader1 },
    });
    assert(badProdWishRes.status === 400, "Test 6: Invalid productId returns 400");

    // Test 7: Nonexistent product
    const nonExWishRes = await fetch(
      `${BASE_URL}/wishlist/66d000000000000000000000`,
      {
        method: "POST",
        headers: { Cookie: cookieHeader1 },
      }
    );
    assert(nonExWishRes.status === 404, "Test 7: Nonexistent product returns 404");

    // Test 8: Request without authentication -> 401
    const unauthWishRes = await fetch(`${BASE_URL}/wishlist/${createdProductId}`, {
      method: "POST",
    });
    assert(unauthWishRes.status === 401, "Test 8: Unauthenticated wishlist request returns 401");

    // Test 9: Isolation test between users
    // User 2 adds bookProductId
    await fetch(`${BASE_URL}/wishlist/${bookProductId}`, {
      method: "POST",
      headers: { Cookie: cookieHeader2 },
    });
    // User 1 gets wishlist (should be empty after delete above)
    const u1Wish = await (
      await fetch(`${BASE_URL}/wishlist`, { headers: { Cookie: cookieHeader1 } })
    ).json();
    // User 2 gets wishlist (should have bookProductId)
    const u2Wish = await (
      await fetch(`${BASE_URL}/wishlist`, { headers: { Cookie: cookieHeader2 } })
    ).json();

    assert(u1Wish.count === 0, "Test 9: User 1 wishlist is empty and isolated");
    assert(
      u2Wish.count === 1 && u2Wish.wishlist[0]._id === bookProductId,
      "Test 9: User 2 wishlist has their own item and is isolated"
    );

    // Bonus Test: PATCH /wishlist/:productId/toggle
    const toggleAdd = await fetch(`${BASE_URL}/wishlist/${bookProductId}/toggle`, {
      method: "PATCH",
      headers: { Cookie: cookieHeader1 },
    });
    const toggleAddData = await toggleAdd.json();
    assert(toggleAddData.saved === true, "Bonus: Wishlist toggle adds product (saved: true)");

    const toggleRemove = await fetch(`${BASE_URL}/wishlist/${bookProductId}/toggle`, {
      method: "PATCH",
      headers: { Cookie: cookieHeader1 },
    });
    const toggleRemoveData = await toggleRemove.json();
    assert(toggleRemoveData.saved === false, "Bonus: Wishlist toggle removes product (saved: false)");

    console.log("\n==================================================");
    console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("==================================================");

    server.close();
    process.exit(0);
  } catch (error) {
    console.error("\nTEST RUN FAILED:", error.message);
    server.close();
    process.exit(1);
  }
}

runTests();
