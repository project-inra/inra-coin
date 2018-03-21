import crypto from "crypto";

class TxOut {
  recipientAdress: string;
  amount: number;

  constructor(recipientAdress: string, amount: number) {
    this.recipientAdress = recipientAdress;
    this.amount = amount;
  }
}

class TxIn {
  senderKey: string;
  signature: string;
  TxOutNumber: number;

  constructor(senderKey: string, signature: string, TxOutNumber: number) {
    this.senderKey = senderKey;
    this.signature = signature;
    this.TxOutNumber = TxOutNumber;
  }
}

class Transaction {
  id: string;
  TxIn: TxIn[];
  TxOut: TxOut[];

  constructor(In: TxIn[], Out: TxOut[]) {
    this.TxIn = In;
    this.TxOut = Out;

    this.createTransactionId();
  }

  createTransactionId(): void {
    const txOutContent: string = this.TxOut.map(
      txOut => txOut.recipientAdress + txOut.amount
    ).reduce((a, b) => a + b, "");

    const txInContent: string = this.TxIn.map(
      txIn => txIn.senderKey + txIn.TxOutNumber
    ).reduce((a, b) => a + b, "");

    this.id = crypto
      .createHmac("sha256", "temporarySecretKey")
      .update(`${txOutContent}${txInContent}`)
      .digest("hex");
  }
}

export { Transaction };
