const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

// Standard cookie settings:
// - httpOnly: true prevents client-side scripts (XSS) from reading the cookie
// - secure: true ensures cookie is sent only over HTTPS in production
// - sameSite: "lax" provides protection against CSRF attacks
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
};

// 1. REGISTER CUSTOMER
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check for missing mandatory fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (fullName, email, password, phone) are required",
      });
    }

    // Check minimum password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Hash password with bcrypt before saving (10 salt rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create and save new customer with hashed password
    const customer = new Customer({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    await customer.save();

    // Return success response without the password
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    // Handle MongoDB unique index duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

// 2. LOGIN CUSTOMER
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      // Return generic 401 without revealing whether email or password was wrong
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare supplied plain-text password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token containing customer ID
    const token = generateToken(customer._id);

    // Store JWT inside an HttpOnly cookie
    res.cookie("token", token, cookieOptions);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

// 3. GET PROFILE
const getMyProfile = async (req, res) => {
  try {
    // req.user was already verified and attached by authMiddleware without password
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching profile",
    });
  }
};

// 4. LOGOUT CUSTOMER
const logoutCustomer = async (req, res) => {
  try {
    // Clear the authentication cookie by setting it with empty value and matching options
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

// 5. BONUS: CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate inputs
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both oldPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Fetch customer with stored password hash using req.user._id
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Verify old password against stored hash
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, customer.password);
    if (!isOldPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    // Hash the new password before storing
    const saltRounds = 10;
    customer.password = await bcrypt.hash(newPassword, saltRounds);

    // Save updated document
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while changing password",
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
};
