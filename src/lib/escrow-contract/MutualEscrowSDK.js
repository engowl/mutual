import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { BN } from "bn.js";
import * as anchor from '@coral-xyz/anchor';
import * as splToken from '@solana/spl-token';
import { Buffer } from 'buffer';
import MUTUAL_ESCROW_IDL from './mutual-escrow-idl.json'; // Import the IDL directly as JSON
import axios from 'axios';

class MutualEscrowSDK {
  constructor({ backendEndpoint, bearerToken, chainId = 'devnet', chains }) {
    this.backendEndpoint = backendEndpoint;
    this.bearerToken = bearerToken;
    this.chainId = chainId;
    this.chains = chains;
  }

  // Helper function to set up headers for backend requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.bearerToken}`,
    };
  }

  // Verify the offer data with the backend
  async verifyOffer(dealData) {
    try {
      const response = await axios.post(
        `${this.backendEndpoint}/campaign/create-offer-check`,
        {
          ...dealData,
          chainId: this.chainId
        },
        {
          headers: this.getHeaders()
        }
      )

      console.log('Offer verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying offer:', error);
      throw error;
    }
  }

  // Prepare the transaction to create a deal
  async prepareCreateDealTransaction({ orderId, mintAddress, kolAddress, userAddress, vestingType, vestingDuration = 0, amount }) {
    try {
      const program = this.getProgram();
      const orderIdBuffer = this.prepareOrderId(orderId);

      const userPublicKey = new PublicKey(userAddress);
      const kolPublicKey = new PublicKey(kolAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const [escrowPda] = PublicKey.findProgramAddressSync([Buffer.from("escrow")], program.programId);
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('deal'), orderIdBuffer, userPublicKey.toBuffer(), kolPublicKey.toBuffer(), mintPublicKey.toBuffer()],
        program.programId
      );
      const [vaultTokenAccountPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token_account"), mintPublicKey.toBuffer()], program.programId);
      const [vaultAuthorityPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_authority")], program.programId);

      const projectOwnerTokenAccount = await splToken.getAssociatedTokenAddress(mintPublicKey, userPublicKey);

      const transaction = new Transaction();

      const ix = await program.methods
        .createDeal(
          new BN(amount),
          { [vestingType.toLowerCase()]: {} },
          new BN(vestingDuration),
          Array.from(orderIdBuffer)
        )
        .accounts({
          escrow: escrowPda,
          deal: dealPda,
          projectOwner: userPublicKey,
          kol: kolPublicKey,
          mint: mintPublicKey,
          projectOwnerTokenAccount: projectOwnerTokenAccount.toBase58(),
          vaultTokenAccount: vaultTokenAccountPda,
          vaultAuthority: vaultAuthorityPda,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      transaction.add(ix);

      const connection = program.provider.connection;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      return transaction;
    } catch (error) {
      console.error('Error preparing create deal transaction:', error);
      throw error;
    }
  }

  async prepareNativeCreateDealTransaction({ orderId, kolAddress, userAddress, vestingType, amount }) {
    try {
      const program = this.getProgram();
      const orderIdBuffer = this.prepareOrderId(orderId);
    
      const userPublicKey = new PublicKey(userAddress);
      const kolPublicKey = new PublicKey(kolAddress);
      const wsolMint = splToken.NATIVE_MINT; // WSOL mint address using the latest spl-token version
    
      const [escrowPda] = PublicKey.findProgramAddressSync([Buffer.from("escrow")], program.programId);
      const [dealPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('deal'), orderIdBuffer, userPublicKey.toBuffer(), kolPublicKey.toBuffer(), wsolMint.toBuffer()],
        program.programId
      );
      const [vaultTokenAccountPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_token_account"), wsolMint.toBuffer()], program.programId);
      const [vaultAuthorityPda] = PublicKey.findProgramAddressSync([Buffer.from("vault_authority")], program.programId);
    
      // Create a temporary WSOL token account for the project owner using the latest SPL-Token API
      const projectOwnerTokenAccount = await splToken.getAssociatedTokenAddress(
        wsolMint,
        userPublicKey
      );
    
      const transaction = new Transaction();
    
      // Step 1: Create the WSOL account if it doesn't exist
      const createAccountIx = splToken.createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        projectOwnerTokenAccount, // associatedToken
        userPublicKey, // owner
        wsolMint // mint
      );
      transaction.add(createAccountIx);
    
      // Step 2: Wrap SOL by transferring it to the WSOL account
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: projectOwnerTokenAccount,
          lamports: amount // Amount of SOL to wrap into WSOL
        })
      );
    
      // Step 3: Sync the WSOL account to ensure it's initialized correctly
      transaction.add(
        splToken.createSyncNativeInstruction(
          projectOwnerTokenAccount
        )
      );
    
      // Step 4: Create the deal using the WSOL mint
      const ix = await program.methods
        .createDeal(
          new BN(amount),
          { [vestingType.toLowerCase()]: {} },
          new BN(0),
          Array.from(orderIdBuffer)
        )
        .accounts({
          escrow: escrowPda,
          deal: dealPda,
          projectOwner: userPublicKey,
          kol: kolPublicKey,
          mint: wsolMint,
          projectOwnerTokenAccount: projectOwnerTokenAccount,
          vaultTokenAccount: vaultTokenAccountPda,
          vaultAuthority: vaultAuthorityPda,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction();
    
      transaction.add(ix);
    
      // Step 5: Close the WSOL account to refund remaining SOL back to the user
      transaction.add(
        splToken.createCloseAccountInstruction(
          projectOwnerTokenAccount,
          userPublicKey,
          userPublicKey,
          []
        )
      );
    
      // Finalize the transaction
      const connection = program.provider.connection;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;
    
      return transaction;
    } catch (error) {
      console.error('Error preparing native create deal transaction:', error);
      throw error;
    }
  }

  // Verify the offer data with the backend
  async createOffer({
    dealData,
    txHash
  }) {
    try {
      const response = await axios.post(
        `${this.backendEndpoint}/campaign/create-offer`,
        {
          ...dealData,
          createDealTxHash: txHash,
          chainId: this.chainId
        },
        {
          headers: this.getHeaders()
        }
      )

      console.log('Offer verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying offer:', error);
      throw error;
    }
  }

  // For KOL to accept the offer
  async acceptOffer(orderId) {
    try {
      const response = await axios.post(
        `${this.backendEndpoint}/campaign/accept-offer`,
        {
          orderId: orderId
        },
        {
          headers: this.getHeaders()
        }
      )

      console.log('Offer acceptance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying offer:', error);
      throw error;
    }
  }

  // For KOL to reject the offer
  async rejectOffer(orderId) {
    try {
      const response = await axios.post(
        `${this.backendEndpoint}/campaign/reject-offer`,
        {
          orderId: orderId
        },
        {
          headers: this.getHeaders()
        }
      )

      console.log('Offer acceptance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying offer:', error);
      throw error;
    }
  }

  // Get the contract logs for a specific offer
  async getOfferContractLogs(orderId) {
    try {
      const response = await axios.get(
        `${this.backendEndpoint}/campaign/${orderId}/contract-logs`,
        {
          headers: this.getHeaders(),
          params: {
            chainId: this.chainId
          }
        }
      )

      console.log('Offer contract logs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting offer contract logs:', error);
      throw error;
    }
  }

  async getOfferClaimableAmount(orderId) {
    try {
      const response = await axios.get(
        `${this.backendEndpoint}/campaign/${orderId}/claimable`,
        {
          headers: this.getHeaders(),
          params: {
            chainId: this.chainId
          }
        }
      )

      console.log('Offer claimable amount:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting offer claimable amount:', error);
      throw error;
    }
  }

  // Send and confirm the transaction
  async sendAndConfirmTransaction(signedTx) {
    try {
      const chain = this.getChain();
      const connection = new Connection(chain.rpcUrl, 'confirmed');
      const txHash = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Transaction hash:', txHash);

      await connection.confirmTransaction(txHash, 'confirmed');
      return txHash;
    } catch (error) {
      console.error('Error sending and confirming transaction:', error);
      throw error;
    }
  }

  // Internal helper to get the Anchor program
  getProgram() {
    const chain = this.getChain();
    const connection = new Connection(chain.rpcUrl, 'confirmed');
    const keypair = new anchor.web3.Keypair()
    const provider = new anchor.AnchorProvider(connection, keypair, {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    });
    return new anchor.Program(MUTUAL_ESCROW_IDL, new PublicKey(chain.escrowProgramId), provider);
  }

  // Internal helper to find the correct chain configuration
  getChain() {
    const chain = this.chains.find((c) => c.id === this.chainId);
    if (!chain) {
      throw new Error('Chain not found');
    }
    return chain;
  }

  // Prepare the order ID (padded to 16 bytes)
  prepareOrderId(orderId) {
    let orderIdBuffer = Buffer.from(orderId, 'utf-8');
    if (orderIdBuffer.length > 16) {
      orderIdBuffer = orderIdBuffer.slice(0, 16);
    } else if (orderIdBuffer.length < 16) {
      const padding = Buffer.alloc(16 - orderIdBuffer.length);
      orderIdBuffer = Buffer.concat([orderIdBuffer, padding], 16);
    }
    return orderIdBuffer;
  }
}

export default MutualEscrowSDK;
