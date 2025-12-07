import { type Hex, verifyMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Validates the payment message format matches the API expectation exactly
 */
export function createPaymentMessage(
  amount: string,
  receiver: string,
  nonce: string,
  timestamp: number
): string {
  return `QueryFlow Payment\nAmount: ${amount}\nTo: ${receiver}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

/**
 * Sign a payment message using a private key
 */
export async function signPayment(
  privateKey: string,
  message: string
): Promise<string> {
  // Ensure strict hex format
  const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(pk as Hex);

  const signature = await account.signMessage({
    message,
  });

  return signature;
}

/**
 * Encode the payment header in Base64 JSON format
 */
export function encodePaymentHeader(
  signature: string,
  timestamp: number,
  amount: string,
  nonce: string,
  payer: string
): string {
  const payload = {
    signature,
    timestamp,
    amount,
    nonce,
    payer,
    mode: "signature", // Explicitly set mode for compatibility with v2 middleware
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}
