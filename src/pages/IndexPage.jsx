import { Button } from "@nextui-org/react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useMemo } from "react";
import { createSolanaMessage } from "../lib/solana";
import toast from "react-hot-toast";
import base58 from "bs58";
import { mutualPublicAPI } from "../api/mutual";
import { useCookies } from "react-cookie";
import { useSession } from "../providers/SessionProvider";

export default function IndexPage() {
  const { connected, connecting } = useWallet();
  const { session, signOut } = useSession();
  console.log({ session });

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-creamy">
      <>
        {session ? (
          <div>
            <h1 className="text-4xl font-medium">Welcome back</h1>
            <p>{JSON.stringify(session)}</p>
            <Button onClick={signOut}>Sign out</Button>
          </div>
        ) : (
          <>
            {connecting ? (
              <>Connecting...</>
            ) : (
              <>{connected ? <SignInCard /> : <RegisterCard />}</>
            )}
          </>
        )}
      </>
    </div>
  );
}

function SignInCard() {
  const { disconnect, wallet, signMessage, signIn: walletSignIn } = useWallet();
  const [, setCookie] = useCookies(["session_token"]);

  async function signIn() {
    if (!wallet) {
      return toast.error("Please connect your wallet first");
    }

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

      console.log({ data });

      setCookie("session_token", data.data.session_token);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign in");
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-medium">
        Please sign in first before continue
      </h1>
      <div className="bg-white p-6 rounded-xl mt-7">
        <div className="flex items-center gap-3 mt-8">
          <Button onClick={disconnect}>Disconnect</Button>
          <Button color="primary" onClick={signIn}>
            Sign in with Solana
          </Button>
        </div>
      </div>
    </div>
  );
}

const ommitedWallets = ["MetaMask"];

function RegisterCard() {
  const { wallets, select } = useWallet();

  const [listedWallets, collapsedWallets] = useMemo(() => {
    const installed = [];
    const notInstalled = [];

    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        if (ommitedWallets.includes(wallet.adapter.name)) {
          continue;
        }
        installed.push(wallet);
      } else {
        notInstalled.push(wallet);
      }
    }

    return installed.length ? [installed, notInstalled] : [notInstalled, []];
  }, [wallets]);

  const handleWalletClick = useCallback(
    (walletName) => {
      select(walletName);
    },
    [select]
  );

  console.log({ listedWallets, collapsedWallets });

  return (
    <div className="bg-white rounded-2xl p-6 w-full max-w-[461px]">
      <div>
        <h2 className="text-[32px] font-medium">Hi 👋</h2>
        <p className="text-2xl font-medium">Welcome to Mutual</p>
        <p className="mt-2">
          Please connect and sign in with your wallet first
        </p>
      </div>
      {listedWallets.length ? (
        <div className="flex flex-col mt-8">
          {listedWallets.map((wallet, idx) => (
            <button
              key={idx}
              onClick={() => handleWalletClick(wallet.adapter.name)}
              className="flex items-center gap-5 py-3 hover:bg-creamy-200 rounded-xl px-4 w-full"
            >
              <div>
                <img
                  src={wallet.adapter.icon}
                  alt={wallet.adapter.name}
                  className="size-[42px]"
                  width={42}
                  height={42}
                />
              </div>
              <div className="flex flex-col items-start">
                <p className="font-medium">{wallet.adapter.name}</p>
                <p className="text-sm">
                  Connect to your {wallet.adapter.name} Wallet
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full h-64 flex flex-col gap-3 items-center justify-center">
          <p>No wallet installed</p>
          <p className="text-sm text-center">
            Please install one of these wallets:
            <br /> <span className="font-medium">Phantom</span> or{" "}
            <span className="font-medium">Solflare</span>
          </p>
        </div>
      )}
    </div>
  );
}
