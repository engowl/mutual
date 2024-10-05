import { useCallback, useEffect, useState } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import Portal from "@portal-hq/web";
import axios from "axios";
import { useCookies } from "react-cookie";
import { jwtDecode } from "jwt-decode";
import { useWallet } from "@solana/wallet-adapter-react";
import base58 from "bs58";
import { createSolanaMessage } from "../solana.js";
import { WalletSignInError } from "@solana/wallet-adapter-base";
import toast from "react-hot-toast";
import { AuthContext } from "../../contexts/AuthContext.js";
import { useNavigate } from "react-router-dom";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  // Google setup
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["session_token"]);
  const [isUserLoading, setUserLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [walletType, setWalletType] = useState(null);

  const navigate = useNavigate();

  // Adapter setup
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

  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const token = cookies.session_token;

  // Get User
  const getUser = useCallback(
    async (props) => {
      const { silentLoad } = props || { silentLoad: false };
      if (!silentLoad) {
        setUserLoading(true);
      }
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.data.user);
        setWalletType(res.data.data.user.wallet.type);

        if (res.data.data.user.wallet.type === "MPC") {
          const portalInstance = new Portal({
            apiKey: res.data.data.user.portalClientApiKey,
            autoApprove: true,
            rpcConfig: {
              "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1":
                "https://api.devnet.solana.com",
              "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp":
                "https://api.mainnet-beta.solana.com",
            },
          });

          await new Promise((resolve) => {
            portalInstance.onReady(async () => {
              setPortal(portalInstance);
              resolve();
            });
          });
        }
        return res.data.data.user;
      } catch (error) {
        console.log("FAILED_GET_USER: ", error);
      } finally {
        if (!silentLoad) {
          setUserLoading(false);
        }
      }
    },
    [token]
  );

  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        // Fetch user info from Google
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        // Check if the user exists
        const userResponse = await axios.post(
          `${BACKEND_BASE_URL}/auth/sign-in/check`,
          {
            email: userInfo.data.email,
          }
        );

        if (userResponse.data.data.isExist) {
          await login(userInfo.data);
        } else {
          await register(userInfo.data);
        }
      } catch (error) {
        console.error("Google Login Failed", error);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      setIsLoggedIn(false);
      setIsGoogleLoading(false);
      console.error("Google Login Failed", error);
    },
  });

  // Function to initiate Google login
  const loginWithGoogle = () => {
    setIsGoogleLoading(true);
    googleLogin();
  };

  // login with google
  const login = async (userInfo) => {
    setIsLoggingIn(true);
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/auth/sign-in/google`, {
        email: userInfo.email,
      });

      const portalInstance = new Portal({
        apiKey: res.data.data.user.portalClientApiKey,
        autoApprove: true,
        rpcConfig: {
          "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1":
            "https://api.devnet.solana.com",
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp":
            "https://api.mainnet-beta.solana.com",
        },
      });

      setCookie("session_token", res.data.data.session_token);

      // Set state
      setPortal(portalInstance);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("FAILED_LOGIN: ", error);
      return;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // register
  const register = async (userInfo) => {
    try {
      // Create client on portal
      const res = await axios.get(`${BACKEND_BASE_URL}/auth/client/create`);
      const client = res.data.data.client;

      // Create MPC wallet
      const portalInstance = new Portal({
        apiKey: client.clientApiKey,
        autoApprove: true,
        rpcConfig: {
          "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1":
            "https://api.devnet.solana.com",
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp":
            "https://api.mainnet-beta.solana.com",
        },
      });

      await new Promise((resolve, reject) => {
        portalInstance.onReady(async () => {
          try {
            await portalInstance.createWallet();
            const solAddress = await portalInstance.getSolanaAddress();

            // Register user
            const registerResponse = await axios.post(
              `${BACKEND_BASE_URL}/auth/register`,
              {
                userCreationType: "GOOGLE",
                email: userInfo.email,
                portalClientId: client.id,
                portalClientApiKey: client.clientApiKey,
                wallet: {
                  address: solAddress,
                },
              }
            );

            setCookie(
              "session_token",
              registerResponse.data.data.session_token
            );

            // Set state
            setPortal(portalInstance);
            setIsLoggedIn(true);
            setWalletType("MPC");

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error("FAILED_CREATE_USER: ", error);
      return;
    }
  };

  // login with wallet setup

  const loginWithWallet = useCallback(async () => {
    console.log("sign in with wallet called");

    setIsWalletLoading(true);

    try {
      const walletSignInData = {
        chainId: import.meta.env.PROD ? "mainnet" : "devnet",
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

      const res = await axios.post(`${BACKEND_BASE_URL}/auth/sign-in`, {
        siwsData,
        type: _type,
      });

      setCookie("session_token", res.data.data.session_token);

      // Set state
      setIsLoggedIn(true);
    } catch (error) {
      disconnect();
      if (error instanceof WalletSignInError) {
        if (error.message.includes("rejected")) {
          return toast.error("Sign in rejected");
        }
      }
      console.error("FAILED_LOGIN: ", error);
      return;
    } finally {
      setIsWalletLoading(false);
    }
  }, [wallet, walletSignIn, setCookie, signMessage, disconnect]);

  // Logout and clear the session
  const logout = useCallback(() => {
    console.log("logout called");
    disconnect();
    removeCookie("session_token");
    setUser(null);
    setPortal(null);
    setIsLoggedIn(false);
    navigate("/");

    googleLogout();
  }, [disconnect, removeCookie]);

  useEffect(() => {
    if (walletType === "EOA") {
      if (connecting || disconnecting || autoConnect) return;
      if (!connected && token) {
        logout();
      }
    }
  }, [
    connected,
    connecting,
    disconnecting,
    isLoggedIn,
    token,
    logout,
    autoConnect,
    walletType,
  ]);

  useEffect(() => {
    if (isLoggedIn || connecting || disconnecting) return;
    if (connected && !token) {
      setWalletType("EOA");
      loginWithWallet();
    }
  }, [
    connected,
    connecting,
    isLoggedIn,
    loginWithWallet,
    disconnecting,
    token,
  ]);

  // Handle Session
  useEffect(() => {
    async function checkSession() {
      if (token) {
        setIsCheckingSession(true);
        try {
          const decodedToken = jwtDecode(token);
          const exp = decodedToken.exp;
          const currentTime = Math.floor(Date.now() / 1000);

          if (exp > currentTime) {
            // const tokenRemainingTime = exp - currentTime;
            await getUser();
            console.log("get user called");
            setIsLoggedIn(true);

            // if (tokenRemainingTime > 5 * 60) {
            //   setIsLoggedIn(true);
            // } else {
            //   const expires = new Date(exp * 1000);
            //   setCookie("session_token", token, { expires });
            //   setIsLoggedIn(true);
            // }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Invalid token", error);
          removeCookie("session_token");
          logout();
        } finally {
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [
    cookies.session_token,
    setCookie,
    removeCookie,
    isLoggedIn,
    token,
    walletType,
    getUser,
    logout,
  ]);

  return (
    <AuthContext.Provider
      value={{
        user,
        getUser,
        portal,
        isLoggedIn,
        loginWithGoogle,
        isGoogleLoading,
        isWalletLoading,
        logout,
        walletType,
        isUserLoading,
        isLoggingIn,
        isCheckingSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
