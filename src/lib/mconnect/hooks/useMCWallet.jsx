import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMCAuth } from "./useMcAuth.jsx";

export default function useMCWallet() {
  const { portal, isLoggedIn, walletType } = useMCAuth();
  const [address, setAddress] = useState(null);
  const [wallet, setWallet] = useState(null);

  const { wallet: walletAdapter, connected, publicKey } = useWallet();

  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (walletType === "MPC" && portal && isLoggedIn) {
        try {
          const solAddress = await portal.getSolanaAddress();
          setAddress(solAddress);
        } catch (error) {
          console.error("Failed to fetch Solana address:", error);
        }
      } else if (walletType === "EOA" && isLoggedIn && connected) {
        setAddress(publicKey.toBase58());
        setWallet(walletAdapter);
      }
    };

    fetchWalletAddress();
  }, [portal, isLoggedIn, walletType, connected, publicKey, walletAdapter]);

  async function signSolanaTxWithPortal({
    messageToSign,
    chainId = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Devnet
  }) {
    if (portal && wallet) {
      console.log("portal: ", portal);
      try {
        const transactionHash = await portal.request({
          chainId,
          method: "sol_sign",
          params: [wallet, messageToSign],
        });

        return transactionHash;
      } catch (error) {
        console.error("Failed to sign transaction:", error);
        throw error;
      }
    } else {
      console.warn("Portal or wallet is not available.");
    }
  }

  return {
    wallet,
    address,
    signSolanaTxWithPortal,
  };
}
