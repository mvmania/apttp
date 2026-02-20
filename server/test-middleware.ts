import { generateAccessToken, generateRefreshToken } from "./utils/jwt.js";

const payload = {
  id: "u123",
  email: "test@apctt.org",
  role: "user",
  is_email_verified: true,
  is_admin: false,
};

console.log("Access Token:");
console.log(generateAccessToken(payload));

console.log("\nRefresh Token:");
console.log(generateRefreshToken(payload.id, "test-refresh-jti"));
