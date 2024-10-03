import { NextUIProvider } from "@nextui-org/react";
import Web3Provider from "./Web3Provider";
import SessionProvider from "./SessionProvider";
import ComponentProvider from "./ComponentProvider";

export default function RootProvider({ children }) {
  return (
    <Web3Provider>
      <SessionProvider>
        <NextUIProvider>
          <ComponentProvider>{children}</ComponentProvider>
        </NextUIProvider>
      </SessionProvider>
    </Web3Provider>
  );
}
