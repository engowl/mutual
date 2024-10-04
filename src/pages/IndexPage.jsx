import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import influencerSvg from "../assets/register-page/influencer.svg";
import projectOwnerSvg from "../assets/register-page/project-owner.svg";
import { useSession } from "../hooks/use-session";

export default function IndexPage() {
  const { connecting } = useWallet();
  const { isSignedIn } = useSession();

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-creamy px-5 py-12">
      <>
        {isSignedIn ? (
          <ChooseRole />
        ) : (
          <>{connecting ? <>Connecting...</> : <RegisterCard />}</>
        )}
      </>
    </div>
  );
}

function ChooseRole() {
  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-medium text-center">
        Get Started by Choosing Your Role
      </h1>
      <div className="mt-7 flex items-center gap-8 flex-col md:flex-row">
        <Link
          to={"/register/influencer"}
          className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 max-w-[300px] overflow-hidden"
        >
          <div className="w-64 h-56">
            <img
              src={influencerSvg}
              alt="influencer-svg"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-2xl font-medium mt-4">Influencer</h3>
          <p className="text-sm text-neutral-400 text-center">
            Set your price and add details for promotional posts on Twitter or
            Telegram.
          </p>
        </Link>
        <Link
          to={"/register/project-owner"}
          className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 max-w-[300px] overflow-hidden"
        >
          <div className="w-56 h-56">
            <img
              src={projectOwnerSvg}
              alt="project-owner-svg"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-2xl font-medium mt-4">Project Owner</h3>
          <p className="text-sm text-neutral-400 text-center">
            Create your campaign and define your budget for influencer
            partnerships.
          </p>
        </Link>
      </div>
    </div>
  );
}

const ommitedWallets = ["MetaMask"];

function RegisterCard() {
  const { wallets, select } = useWallet();

  const [listedWallets] = useMemo(() => {
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
