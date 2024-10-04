import { useWallet } from "@solana/wallet-adapter-react";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createSolanaMessage } from "../lib/solana";
import base58 from "bs58";
import { mutualPublicAPI } from "../api/mutual";
import { WalletSignInError } from "@solana/wallet-adapter-base";
import { sessionContext } from "../contexts/SessionContext";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function SessionProvider({ children }) {
  // const [cookies, setCookie, removeCookie] = useCookies(["session_key"]);
  const [sessionKey, saveSessionKey] = useLocalStorage("session_key", null);
  const [session, setSession] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  console.log({ session });

  const {
    disconnect,
    wallet,
    signMessage,
    signIn: walletSignIn,
    connected,
    connecting,
    disconnecting,
    autoConnect,
  } = useWallet();

  const signOut = useCallback(() => {
    disconnect();
    localStorage.removeItem("session_key");
    setSession(null);
  }, [disconnect]);

  const signIn = useCallback(async () => {
    console.log("sign in called");
    if (!wallet) {
      return toast.error("Please connect your wallet first");
    }

    setIsSigningIn(true);

    const loadingToast = toast.loading(
      "Please sign the message in your wallet"
    );
    try {
      const walletSignInData = {
        chainId: "devnet",
        address: wallet.adapter.publicKey
          ? wallet.adapter.publicKey.toBase58()
          : "",
        domain: window.location.host,
        statement: `Sign in to Mutual`,
      };

      let siwsData = null;
      let _type = "";

      console.log({ walletSignIn });

      if (walletSignIn) {
        // Sign in with solana - phantom wallet compliant
        const signInWalletRes = await walletSignIn(walletSignInData);
        const output = signInWalletRes;

        siwsData = JSON.stringify({
          input: walletSignInData,
          output: output,
          publicKey: wallet.adapter.publicKey.toBase58(),
        });

        _type = "siws";
      } else {
        // Sign in with solana - custom message
        const message = createSolanaMessage(
          wallet.adapter.publicKey,
          "Sign in to Mutual"
        );
        console.log(message);

        const encodedMessage = new TextEncoder().encode(message);

        const signature = await signMessage(encodedMessage);

        siwsData = JSON.stringify({
          signature: base58.encode(signature),
          encodedMessage: base58.encode(encodedMessage),
          publicKey: wallet.adapter.publicKey.toBase58(),
        });

        _type = "message";
      }

      const { data } = await mutualPublicAPI.post("/auth/sign-in", {
        siwsData,
        type: _type,
      });

      console.log({ data }, "FROM BACKEND");

      saveSessionKey(data.data.session_token);

      toast.success("Signed in successfully");
    } catch (error) {
      disconnect();
      console.error(error);
      if (error instanceof WalletSignInError) {
        return toast.error(error.message);
      }
      toast.error("Failed to sign in");
    } finally {
      toast.dismiss(loadingToast);
      setIsSigningIn(false);
    }
  }, [wallet, walletSignIn, saveSessionKey, signMessage, disconnect]);

  useEffect(() => {
    if (isSigningIn || connecting || disconnecting || autoConnect) return;
    if (!connected && sessionKey) {
      signOut();
    }
  }, [
    connected,
    connecting,
    disconnecting,
    isSigningIn,
    signOut,
    sessionKey,
    autoConnect,
  ]);

  useEffect(() => {
    if (isSigningIn || connecting || disconnecting) return;
    if (connected && wallet && !sessionKey) {
      signIn();
    }
  }, [
    connected,
    connecting,
    wallet,
    isSigningIn,
    signIn,
    disconnecting,
    sessionKey,
  ]);

  useEffect(() => {
    if (sessionKey) {
      try {
        const decodedToken = jwtDecode(sessionKey);

        // console.log({ decodedToken });

        const exp = decodedToken.exp;

        const currentTime = Math.floor(Date.now() / 1000);

        if (exp > currentTime) {
          setSession(decodedToken);
        } else {
          saveSessionKey(null);
          localStorage.removeItem("session_key");
          setSession(null);
        }
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("session_key");
        setSession(null);
      }
    } else {
      localStorage.removeItem("session_key");
      setSession(null);
    }
  }, [saveSessionKey, sessionKey]);

  return (
    <sessionContext.Provider
      value={{
        session,
        signOut,
        signIn,
        isSigningIn,
        isSignedIn: connected && session,
      }}
    >
      {children}
    </sessionContext.Provider>
  );
}
