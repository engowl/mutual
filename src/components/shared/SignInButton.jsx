// Sign in with solana custom button

import { Button } from "@nextui-org/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function SignInButton() {
  const { setVisible } = useWalletModal();
  function handleSignIn() {
    setVisible(true);
    console.log("Sign in");
  }
  return <Button onClick={handleSignIn}>Sign In</Button>;
}
