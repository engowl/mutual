import { NextUIProvider } from "@nextui-org/react";
import ComponentProvider from "./ComponentProvider";
import MCProvider from "../mconnect/MCProvider.jsx";

export default function RootProvider({ children }) {
  return (
    <MCProvider>
      <NextUIProvider>
        <ComponentProvider>{children}</ComponentProvider>
      </NextUIProvider>
    </MCProvider>
  );
}
