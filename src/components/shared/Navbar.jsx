import { Link, NavLink, useLocation } from "react-router-dom";
import SignInButton from "./SignInButton";
import { cnm } from "../../utils/style";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth.jsx";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, isLoggedIn } = useMCAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const location = useLocation(); // Get the current pathname
  const pathname = location.pathname;

  console.log({ user, isLoggedIn });

  useEffect(() => {
    if (user && isLoggedIn && user.role) {
      if (user.role === "INFLUENCER") {
        setIsRegistered(user.influencer && user.influencer.packages.length > 0);
      } else if (user.role === "PROJECT_OWNER") {
        setIsRegistered(
          user.projectOwner && user.projectOwner.status === "APPROVED"
        );
      }
    }
  }, [user, isLoggedIn, setIsRegistered]);

  const logoSrc = pathname.includes("/project-owner")
    ? "/assets/mutual_text_logo.png"
    : pathname.includes("/influencer")
    ? "/assets/mutual_kol_logo.png"
    : "/assets/mutual_text_logo.png";

  return (
    <nav className="flex items-center px-5 md:px-8 h-12 justify-between border-b border-black/20 overflow-hidden">
      <div className="flex h-full items-center">
        <Link to={"/"} className="text-xl font-medium">
          <img src={logoSrc} alt="mutual_logo" className="w-24" />
        </Link>

        <div className="h-full hidden md:inline">
          {user &&
          isLoggedIn &&
          isRegistered &&
          user.role === "PROJECT_OWNER" ? (
            <ProjectOwnerNav />
          ) : user &&
            isLoggedIn &&
            isRegistered &&
            user.role === "INFLUENCER" ? (
            <InfluencerNav />
          ) : null}
        </div>
      </div>
      <SignInButton />
    </nav>
  );
}

function ProjectOwnerNav() {
  return (
    <div className="flex ml-6 h-full">
      <NavLink
        to={"/project-owner/browse"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Browse
          </>
        )}
      </NavLink>
      <NavLink
        to={"/project-owner/offers"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Offers
          </>
        )}
      </NavLink>
      <NavLink
        to={"/message"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Message
          </>
        )}
      </NavLink>
    </div>
  );
}

function InfluencerNav() {
  return (
    <div className="flex ml-6 h-full">
      <NavLink
        to={"/influencer/profile"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Profile
          </>
        )}
      </NavLink>
      <NavLink
        to={"/influencer/offers"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Offers
          </>
        )}
      </NavLink>
      <NavLink
        to={"/message"}
        className={({ isActive }) =>
          cnm(
            "h-full w-24 flex items-center justify-center relative text-sm",
            isActive ? "text-black" : "text-neutral-500"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cnm(
                "absolute bottom-0 w-16 h-[3px] bg-black rounded-t-[4px]",
                isActive ? "block" : "hidden"
              )}
            />
            Message
          </>
        )}
      </NavLink>
    </div>
  );
}
