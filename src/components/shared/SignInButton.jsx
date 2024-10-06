import MCWalletWidget from "../../lib/mconnect/components/MCWalletWidget.jsx";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth.jsx";

export default function SignInButton() {
  const { isLoggedIn } = useMCAuth();

  if (!isLoggedIn) {
    return null;
  }

  return <MCWalletWidget />;
}
