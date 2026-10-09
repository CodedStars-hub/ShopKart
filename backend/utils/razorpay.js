const Razorpay = require("razorpay");

/**
 * Initializes and returns a Razorpay client instance.
 * Validates that required environment variables are set.
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    const error = new Error(
      "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    );
    error.status = 500;
    throw error;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

module.exports = {
  getRazorpayInstance,
};
