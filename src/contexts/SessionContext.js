import { createContext } from "react";

export const sessionContext = createContext({
  session: null,
  signOut: () => {},
  signIn: () => {},
  isSigningIn: false,
  isSignedIn: false,
});
