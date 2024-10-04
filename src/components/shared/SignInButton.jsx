import { useAuth } from "../../mconnect/AuthProvider.jsx";
import MCWalletWidget from "../../mconnect/components/MCWalletWidget.jsx";

export default function SignInButton() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return null;
  }

  return <MCWalletWidget />;
}
