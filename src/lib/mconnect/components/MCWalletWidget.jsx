import useMCWallet from "../hooks/useMCWallet.jsx";
import { shortenId } from "../utils/formattingUtils.js";
import { DropdownIcon, GoogleIcon } from "./ui/Icons.jsx";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { Spinner } from "@nextui-org/react";
import { useMCAuth } from "../hooks/useMCAuth.jsx";
import { shortenAddress } from "../../../utils/string.js";
import toast from "react-hot-toast";
import { Copy, LogOut } from "lucide-react";

export default function MCWalletWidget() {
  const {
    address,
    wallet,
    isWalletLoading,
    getBalance,
    balance,
    isGetBalanceLoading,
  } = useMCWallet();
  const { walletType, logout, user } = useMCAuth();

  async function handleCopyAddress() {
    await navigator.clipboard.writeText(address);
    toast.success("Address Copied!");
  }

  return isWalletLoading || !address ? (
    <div className="py-2">
      <div className="flex items-center justify-center rounded-full bg-white h-8 w-36 border-[1px] border-[#C9C9C9]">
        <Spinner
          size="sm"
          color="primary"
          classNames={{
            wrapper: "flex items-center justify-center",
            circle1: "h-4 w-4",
            circle2: "h-4 w-4",
          }}
        />
      </div>
    </div>
  ) : (
    <Menu as="div" className="relative">
      <MenuButton
        onClick={async () => {
          await getBalance();
        }}
      >
        <div className="flex items-center justify-center gap-2 rounded-full bg-white border-[1px] border-[#C9C9C9] p-1">
          {walletType == "MPC" ? (
            <GoogleIcon className="size-5" />
          ) : (
            <img src={wallet?.adapter?.icon} className="size-5 rounded-full" />
          )}
          <div className="flex gap-2 pr-4 items-center">
            <p className="text-xs text-[#575757]">{shortenId(address)}</p>
            <DropdownIcon />
          </div>
        </div>
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-1 py-4 origin-top-right rounded-xl backdrop-blur-xl z-50 bg-white border-[1px] border-[#C9C9C9] h-[20rem] overflow-y-scroll">
          <div className="flex flex-col items-start text-[#131523]">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 px-4">
              <div className="size-7">
                {walletType == "MPC" ? (
                  <GoogleIcon className="w-full h-full" />
                ) : (
                  <img
                    src={wallet?.adapter?.icon}
                    className="rounded-full h-full w-full"
                  />
                )}
              </div>

              <div className="flex flex-col items-start">
                {user?.email && <h1 className="font-medium">{user?.email}</h1>}
                <p>{shortenAddress(address)}</p>
              </div>

              <div className="flex gap-2 ml-auto md:ml-4">
                <button
                  onClick={handleCopyAddress}
                  className="rounded-full p-3 bg-[#E5E5E5] hover:bg-[#E5E5E5]/70  w-full flex items-center"
                >
                  <Copy size={16} />
                </button>

                <button
                  onClick={logout}
                  className="rounded-full p-3 bg-[#E5E5E5] hover:bg-[#E5E5E5]/70  w-full flex items-center"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[#C9C9C9] my-4" />

            <div className="flex flex-col gap-4 w-full px-4">
              <div className="flex items-center justify-between">
                <h1>Holdings</h1>
              </div>

              {isGetBalanceLoading ? (
                <div className="flex items-center justify-center h-40 w-full">
                  <Spinner size="md" color="primary" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="size-10 rounded-full overflow-hidden">
                        <img
                          src={balance?.nativeBalance?.imageUrl}
                          alt="ic"
                          className="h-full w-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-medium">
                          {balance?.nativeBalance?.name}
                        </p>
                        <p>
                          {balance?.nativeBalance?.amount} $
                          {balance?.nativeBalance?.symbol}
                        </p>
                      </div>
                    </div>
                  </div>

                  {balance?.splBalance?.map((spl) => {
                    return (
                      <div
                        key={spl.mint}
                        className="flex items-center justify-between"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="size-10 rounded-full overflow-hidden">
                            <img
                              src={spl?.token?.imageUrl}
                              alt="ic"
                              className="h-full w-full"
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-medium">{spl?.token?.name}</p>
                            <p>
                              {spl?.tokenAmount} ${spl?.token?.symbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
