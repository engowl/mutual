import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMCAuth } from "./useMCAuth.jsx";
import { mutualAPI } from "../../../api/mutual.js";

export default function useMCWallet() {
  const { portal, isLoggedIn, walletType, chain } = useMCAuth();
  const [address, setAddress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isWalletLoading, setWalletLoading] = useState(false);
  const [balance, setBalance] = useState(false);

  const { wallet: walletAdapter, connected, publicKey } = useWallet();

  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (walletType === "MPC" && portal && isLoggedIn) {
        console.log(portal);

        setWalletLoading(true);
        try {
          const solAddress = await portal.getSolanaAddress();
          await getBalance();
          setAddress(solAddress);
        } catch (error) {
          console.error("Failed to fetch Solana address:", error);
        } finally {
          setWalletLoading(false);
        }
      } else if (walletType === "EOA" && isLoggedIn && connected) {
        await getBalance();
        setAddress(publicKey.toBase58());
        setWallet(walletAdapter);
      }
    };

    fetchWalletAddress();
  }, [portal, isLoggedIn, walletType, connected, publicKey, walletAdapter]);

  async function getBalance() {
    try {
      const res = await mutualAPI.get("/balance");
      setBalance(res.data.data.balance);
    } catch (error) {
      console.error("Failed to get balance", error);
    }
  }

  async function signSolanaTxWithPortal({ messageToSign }) {
    if (portal && address) {
      console.log("chain :", chain);

      try {
        const transactionHash = await portal.request({
          chainId: chain.portalChainId,
          method: "sol_signTransaction",
          params: messageToSign,
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
    balance,
    signSolanaTxWithPortal,
    isWalletLoading,
  };
}
