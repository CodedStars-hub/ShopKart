# ShopKart — Customer Authentication Service (Engineering Lab 01)

Backend authentication service built using **Node.js, Express, MongoDB, Mongoose, bcrypt, and jsonwebtoken (JWT)** with secure **HttpOnly cookie** authentication.

---

## 🚀 Setup & Installation

### 1. Install Dependencies
Navigate into the `backend/` directory and install the packages:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or configure your MongoDB connection):
```bash
cp .env.example .env
```
Default `.env` contents:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=shopkart_secret_key_2026_exam_secure
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

### 3. Start the Server
Make sure MongoDB is running on your machine, then execute:
```bash
npm start
```
Or run in watch mode during development:
```bash
npm run dev
```

---

## 📬 Postman Testing Guide

Postman automatically manages cookies received from responses. Follow this sequential testing guide:

### Step 1: Register Customer
- **Method:** `POST`
- **URL:** `http://localhost:5000/customers/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "password": "john123",
    "phone": "9876543210"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Customer registered successfully",
    "customer": {
      "_id": "...",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "phone": "9876543210"
    }
  }
  ```
- *Check:* Ensure the password is **not** present in the response.

---

### Step 2: Duplicate Registration Test
- Send the exact same request body from **Step 1** again.
- **Expected Status:** `409 Conflict`
- **Expected Response:**
  ```json
  {
    "success": false,
    "message": "Email is already registered"
  }
  ```

---

### Step 3: Profile Without Authentication (Protected Route Check)
- **Method:** `GET`
- **URL:** `http://localhost:5000/customers/me`
- **Expected Status:** `401 Unauthorized`
- **Expected Response:**
  ```json
  {
    "success": false,
    "message": "Unauthorized: No token provided"
  }
  ```

---

### Step 4: Login Customer
- **Method:** `POST`
- **URL:** `http://localhost:5000/customers/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "john@gmail.com",
    "password": "john123"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Login successful"
  }
  ```
- *Check:* Open Postman's **Cookies** tab (under the Send button on the right). You will see a cookie named `token` with `HttpOnly` enabled.

---

### Step 5: Profile After Login
- **Method:** `GET`
- **URL:** `http://localhost:5000/customers/me`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "phone": "9876543210",
    "createdAt": "..."
  }
  ```
- *Check:* The password field is not returned.

---

### Step 6: Change Password (Bonus Task)
- **Method:** `PATCH`
- **URL:** `http://localhost:5000/customers/change-password`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "oldPassword": "john123",
    "newPassword": "john456"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```
- *Verification:* Try logging in with the old password `john123` (returns `401 Invalid credentials`). Then log in with `john456` (returns `200 Login successful`).

---

### Step 7: Logout Customer
- **Method:** `POST`
- **URL:** `http://localhost:5000/customers/logout`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- *Check:* The `token` cookie is cleared in Postman.

---

### Step 8: Profile After Logout
- **Method:** `GET`
- **URL:** `http://localhost:5000/customers/me`
- **Expected Status:** `401 Unauthorized`
- **Expected Response:**
  ```json
  {
    "success": false,
    "message": "Unauthorized: No token provided"
  }
  ```
