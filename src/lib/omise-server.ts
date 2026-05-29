// Server-only Omise client. Do NOT import from client components.
import Omise from "omise";

const secretKey = process.env.OMISE_SECRET_KEY;
const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;

if (!secretKey || !publicKey) {
  throw new Error(
    "Missing Omise keys. Set OMISE_SECRET_KEY + NEXT_PUBLIC_OMISE_PUBLIC_KEY in .env.local"
  );
}

export const omise = Omise({
  secretKey,
  publicKey,
});

export { secretKey as omiseSecretKey };
