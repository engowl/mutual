import useMCWallet from "../hooks/useMCWallet.jsx";
import { shortenId } from "../utils/formattingUtils.js";
import { DropdownIcon, GoogleIcon } from "./ui/Icons.jsx";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { Spinner } from "@nextui-org/react";
import { useMCAuth } from "../hooks/useMcAuth.jsx";

export default function MCWalletWidget() {
  const { address, wallet, isWalletLoading } = useMCWallet();
  const { walletType, logout } = useMCAuth();
  const [copied, setCopied] = useState(false);

  async function handleCopyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <MenuButton>
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
        <MenuItems className="absolute right-0 mt-1 w-56 origin-top-right rounded-xl p-4 backdrop-blur-xl z-50 bg-white border-[1px] border-[#C9C9C9]">
          <div className="flex flex-col items-start text-[#131523]">
            <button
              onClick={handleCopyAddress}
              className="px-3 py-1.5 rounded-md hover:bg-black/5  w-full flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-copy"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              {copied ? "Copied!" : "Copy Address"}
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md hover:bg-black/5 w-full flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-unplug"
              >
                <path d="m19 5 3-3" />
                <path d="m2 22 3-3" />
                <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                <path d="M7.5 13.5 10 11" />
                <path d="M10.5 16.5 13 14" />
                <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />
              </svg>
              Logout
            </button>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
