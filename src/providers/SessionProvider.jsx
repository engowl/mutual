import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

const sessionContext = createContext({
  session: null,
  signOut: () => {},
});

export const useSession = () => {
  const context = useContext(sessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export default function SessionProvider({ children }) {
  const [cookies, setCookie, removeCookie] = useCookies([
    "session_token",
    "session_mutual",
  ]);
  const [session, setSession] = useState(null);
  const token = cookies.session_token;

  function signOut() {
    removeCookie("session_token");
    removeCookie("session_mutual");
    setSession(null);
  }

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);

        console.log({ decodedToken });

        const exp = decodedToken.exp;

        const currentTime = Math.floor(Date.now() / 1000);

        if (exp > currentTime) {
          setSession(decodedToken);

          const expires = new Date(exp * 1000);
          setCookie("session_mutual", token, { expires });
        } else {
          removeCookie("session_mutual");
          setSession(null);
        }
      } catch (error) {
        console.error("Invalid token", error);
        removeCookie("session_mutual");
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, [token, setCookie, removeCookie]);

  return (
    <sessionContext.Provider value={{ session, signOut }}>
      {children}
    </sessionContext.Provider>
  );
}
