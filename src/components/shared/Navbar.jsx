import { Link, NavLink } from "react-router-dom";
import SignInButton from "./SignInButton";
import { cnm } from "../../utils/style";
import { useMCAuth } from "../../lib/mconnect/hooks/useMcAuth.jsx";

export default function Navbar() {
  const { user, isLoggedIn } = useMCAuth();

  return (
    <nav className="flex items-center px-8 py-2 justify-between border-b border-black/20">
      <div className="flex h-full items-center">
        <Link to={"/"} className="text-xl font-medium">
          MUTUAL
        </Link>

        {user && isLoggedIn && user.role === "project-owner" ? (
          <ProjectOwnerNav />
        ) : user && isLoggedIn && user.role === "influencer" ? (
          <InfluencerNav />
        ) : null}
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
        to={"/project-owner/message"}
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
        to={"/influencer/message"}
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
