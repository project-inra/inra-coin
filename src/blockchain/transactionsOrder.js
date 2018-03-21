/**
 * For transactions testing
 */

// @flow
import secp from "secp256k1";
import { randomBytes } from "crypto";

class Wallet {
  privateKey: string;
  publicKey: string;

  constructor() {
    do {
      this.privateKey = randomBytes(32);
    } while (!secp.privateKeyVerify(this.privateKey));

    this.publicKey = secp.publicKeyCreate(this.privateKey);
  }

  transactionsOrder(adress: string, ammount: number): object {}
}
