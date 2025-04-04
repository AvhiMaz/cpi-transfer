import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorCpiTransfer } from "../target/types/anchor_cpi_transfer";

describe("anchor-cpi-transfer", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .AnchorCpiTransfer as Program<AnchorCpiTransfer>;

  const payer = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();

  before(async () => {
    const sig1 = await provider.connection.requestAirdrop(
      payer.publicKey,
      1_000_000_000
    );
    const sig2 = await provider.connection.requestAirdrop(
      receiver.publicKey,
      1_000_000
    );

    await provider.connection.confirmTransaction(sig1, "confirmed");
    await provider.connection.confirmTransaction(sig2, "confirmed");

    const payerBal = await provider.connection.getBalance(payer.publicKey);
    const recvBal = await provider.connection.getBalance(receiver.publicKey);
    console.log("payer:", payerBal, "receiver:", recvBal);
  });

  it("cpi transfer", async () => {
    const tx = await program.methods
      .sendSol(new anchor.BN(100_000))
      .accounts({
        from: payer.publicKey,
        to: receiver.publicKey,
      })
      .signers([payer])
      .rpc();

    console.log("transfer TX:", tx);

    const recvBal = await provider.connection.getBalance(receiver.publicKey);
    console.log("receiver balance after transfer:", recvBal);
  });
});
