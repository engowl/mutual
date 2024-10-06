import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout, getMint } from "@solana/spl-token";

const SOLANA_CLUSTER = "https://api.mainnet-beta.solana.com"; // Use the appropriate cluster

// Custom hook to get wallet tokens and filter by a specific token mint
const useWalletTokens = (walletAddress, specificMint = null) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const connection = new Connection(SOLANA_CLUSTER);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      const tokenDetails = await Promise.all(
        tokenAccounts.value.map(async (accountInfo) => {
          const accountData = AccountLayout.decode(accountInfo.account.data);
          const mintAddress = new PublicKey(accountData.mint);

          // Fetch the mint info to get the decimal places
          const mintInfo = await getMint(connection, mintAddress);
          const decimals = mintInfo.decimals;
          // Normalize the amount using decimals
          const normalizedAmount = accountData.amount / Math.pow(10, decimals);

          return {
            mint: mintAddress.toString(),
            amount: normalizedAmount, // Normalized amount
            owner: accountInfo.pubkey.toString(),
          };
        })
      );

      // If specificMint is provided, filter the results to only return that token
      const filteredTokens = specificMint
        ? tokenDetails.filter((token) => token.mint === specificMint)
        : tokenDetails;

      setTokens(filteredTokens);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTokens();
    }
  }, [walletAddress, specificMint]);

  return { tokens, loading, error };
};

export default useWalletTokens;
