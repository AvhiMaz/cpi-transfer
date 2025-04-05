import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { expect, test } from "bun:test";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");

const PROGRAM_ID = new PublicKey(
  "7DQqd745erm7WfhPzQoKGAeZYkvRJPf7sipqT85Pg22d"
);

const sender = Keypair.generate();
const recipient = Keypair.generate();

test("transfer", async () => {
  console.log("Airdropping SOL...");
  const airdropSignature = await connection.requestAirdrop(
    sender.publicKey,
    2e9
  );
  await connection.confirmTransaction(airdropSignature);

  let senderBalanceBefore = await connection.getBalance(sender.publicKey);
  console.log("Sender Balance Before:", senderBalanceBefore);

  let receiverBalanceBefore = await connection.getBalance(recipient.publicKey);
  console.log("Recipient Balance Before:", receiverBalanceBefore);

  const transferAmount = 1_000_000_000;
  const instructionData = Buffer.alloc(8);
  instructionData.writeBigUInt64LE(BigInt(transferAmount));

  console.log("Creating transaction...");
  const transaction = new Transaction().add({
    keys: [
      { pubkey: sender.publicKey, isSigner: true, isWritable: true },
      { pubkey: recipient.publicKey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: instructionData,
  });

  console.log("Sending transaction...");
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    sender,
  ]);
  console.log("Transaction successful! Signature:", signature);

  // Fetch transaction details to get CU consumed
  console.log("Fetching transaction details...");
  const txDetails = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0, // Supports legacy and versioned transactions
  });

  if (txDetails?.meta?.computeUnitsConsumed !== undefined) {
    console.log("Compute Units Consumed:", txDetails.meta.computeUnitsConsumed);
  } else {
    console.log("Compute Units data not available.");
  }

  let senderBalanceAfter = await connection.getBalance(sender.publicKey);
  let recipientBalanceAfter = await connection.getBalance(recipient.publicKey);

  console.log("Sender Balance After:", senderBalanceAfter);
  console.log("Recipient Balance After:", recipientBalanceAfter);

  expect(senderBalanceAfter).toBeLessThan(senderBalanceBefore);
  expect(recipientBalanceAfter).toBe(receiverBalanceBefore + transferAmount);
});
