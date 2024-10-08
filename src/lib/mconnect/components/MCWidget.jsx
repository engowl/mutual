import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { GoogleIcon, WalletIcon } from "./ui/Icons.jsx";
import { Spinner } from "@nextui-org/react";
import { useMCAuth } from "../hooks/useMCAuth.jsx";

export default function MCWidget() {
  const { isLoggedIn, loginWithGoogle, isWalletLoading, isGoogleLoading } =
    useMCAuth();
  const { connect, connected, wallet } = useWallet();
  const { setVisible: setWalletModalOpen } = useWalletModal();

  async function handleConnect() {
    if (connected) return;
    if (!wallet) {
      return setWalletModalOpen(true);
    }
    try {
      await connect();
    } catch (e) {
      console.log(e);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex w-full items-center justify-center px-5 md:px-10 bg-[#F0EFEA] relative">
        <div className="flex flex-col gap-5 items-center justify-center w-full max-w-md text-[#161616] rounded-xl mx-auto bg-[#F7F8FA] p-6 drop-shadow-sm border-[#EDEEF0] border-[1px]">
          {isGoogleLoading || isWalletLoading ? (
            <Loading />
          ) : (
            <LoginContent
              loginWithGoogle={loginWithGoogle}
              handleConnect={handleConnect}
            />
          )}
        </div>
      </div>
    );
  }
}

const LoginContent = ({ loginWithGoogle, handleConnect }) => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center w-full">
      <div className="flex flex-col items-start w-full">
        <h1 className="text-[32px] font-medium">Hi! 👋</h1>
        <h2 className="text-2xl font-medium">Welcome to Mutual</h2>
      </div>

      <div className="flex flex-col w-full gap-2">
        <button
          onClick={loginWithGoogle}
          className="py-3 text-sm flex gap-4 items-center justify-start w-full hover:bg-creamy-400 px-2 rounded-xl"
        >
          <div className="p-2 rounded-full bg-[#E6E6E6]">
            <GoogleIcon className="h-8 w-8" />
          </div>

          <div className="flex flex-col items-start gap-0.5 w-full">
            <h1 className="text-sm text-[#131523] font-medium">
              Login with Google
            </h1>
            <p className="text-xs text-[#575757] text-start">
              Quickly connect using your Google Account
            </p>
          </div>
        </button>

        <div className="w-full h-[1px] bg-[#D9D9D9] flex"></div>

        <button
          onClick={handleConnect}
          className="py-3 text-sm flex gap-4 items-center justify-start w-full hover:bg-creamy-400 px-2 rounded-xl"
        >
          <div className="p-2 rounded-full bg-[#E6E6E6]">
            <WalletIcon className="h-8 w-8" />
          </div>

          <div className="flex flex-col items-start gap-0.5 w-full">
            <h1 className="text-sm text-[#131523] font-medium">
              Login with Wallet
            </h1>
            <p className="text-xs text-[#575757] text-start">
              Securely access Mutual with your Web3 Wallet.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

const Loading = () => {
  return (
    <div className="flex flex-col gap-5 items-center justify-center w-full">
      <Spinner
        size="xl"
        color="primary"
        className="flex items-center justify-center w-full"
      />

      <h1 className="text-sm text-[#575757]">Logging you in...</h1>
    </div>
  );
};
