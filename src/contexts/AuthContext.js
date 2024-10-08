import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  getUser: () => {},
  portal: null,
  isLoggedIn: false,
  loginWithGoogle: () => {},
  isGoogleLoading: false,
  isWalletLoading: false,
  logout: () => {},
  walletType: null,
  isUserLoading: false,
  isLoggingIn: false,
  isCheckingSession: false,
  chain: null
});
