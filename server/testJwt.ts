import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken} from "./utils/jwt.js";

const payload = {
  id: "u123",
  email: "test@example.com",
  role: "user"
};

const access = generateAccessToken(payload);
const refresh = generateRefreshToken(payload);

console.log("Access Token:\n", access);
console.log("\nRefresh Token:\n", refresh);
// VERIFY TOKENS
console.log("\nDecoded Access:");
console.log(verifyAccessToken(access));

console.log("\nDecoded Refresh:");
console.log(verifyRefreshToken(refresh));