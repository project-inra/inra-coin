// @flow
import crypto from "crypto";

export default function createHash(data: string): string {
  return crypto
    .createHmac("sha256", "secret")
    .update(data)
    .digest("hex");
}
