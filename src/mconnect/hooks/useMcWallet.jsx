import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider.jsx";
import { useWallet } from "@solana/wallet-adapter-react";

export default function useMCWallet() {
  const { portal, isLoggedIn, addressType } = useAuth();
  const [address, setAddress] = useState(null);
  const [wallet, setWallet] = useState(null);

  const {
    disconnect,
    wallet: walletAdapter,
    signMessage,
    connected,
    publicKey,
  } = useWallet();

  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (addressType === "MPC" && portal && isLoggedIn) {
        try {
          const solAddress = await portal.getSolanaAddress();
          setAddress(solAddress);
        } catch (error) {
          console.error("Failed to fetch Solana address:", error);
        }
      } else if (addressType === "WALLET" && isLoggedIn && connected) {
        setAddress(publicKey.toBase58());
        setWallet(walletAdapter);
      }
    };

    fetchWalletAddress();
  }, [portal, isLoggedIn, addressType]);

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
