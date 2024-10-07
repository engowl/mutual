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
  const [isGetBalanceLoading, setGetBalanceLoading] = useState(false);

  const { wallet: walletAdapter, connected, publicKey } = useWallet();

  useEffect(() => {
    const fetchWalletAddress = async () => {
      setWalletLoading(true);
      try {
        if (walletType === "MPC" && portal && isLoggedIn) {
          console.log(portal);

          const solAddress = await portal.getSolanaAddress();
          setAddress(solAddress);
          await getBalance();
        } else if (walletType === "EOA" && isLoggedIn && connected) {
          setAddress(publicKey.toBase58());
          setWallet(walletAdapter);

          await getBalance();
        }
      } catch (error) {
        console.error("Failed to fetch Solana address:", error);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletAddress();
  }, [portal, isLoggedIn, walletType, connected, publicKey, walletAdapter]);

  async function getBalance() {
    setGetBalanceLoading(true);
    try {
      if (address && chain) {
        const res = await mutualAPI.get(
          `/wallet/portfolio?walletAddress=${address}&chainId=${chain.chainId}`
        );
        setBalance(res.data);
        return res.data;
      }
    } catch (error) {
      console.error("Failed to get balance", error);
    } finally {
      setGetBalanceLoading(false);
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
    getBalance,
    balance,
    signSolanaTxWithPortal,
    isWalletLoading,
    isGetBalanceLoading,
  };
}
