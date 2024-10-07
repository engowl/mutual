import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./AuthProvider.jsx";
import Web3Provider from "./Web3Provider.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function MCProvider({ children }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Web3Provider>
        <AuthProvider chainId="devnet">{children}</AuthProvider>
      </Web3Provider>
    </GoogleOAuthProvider>
  );
}
