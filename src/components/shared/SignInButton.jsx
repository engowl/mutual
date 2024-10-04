// Sign in with solana custom button

import { Button } from "@nextui-org/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "../../utils/string";
import { useSession } from "../../providers/SessionProvider";

export default function SignInButton() {
  const { wallet, disconnect } = useWallet();
  const { signOut } = useSession();

  function handleSignOut() {
    signOut();
    disconnect();
  }

  if (!wallet) {
    return null;
  }

  return (
    <Button onClick={handleSignOut}>
      {shortenAddress(wallet.adapter.publicKey?.toBase58() || "")}
    </Button>
  );
}
