import { Link, NavLink } from "react-router-dom";
import { cnm } from "../../../utils/style";
import { Button } from "@nextui-org/react";

export default function AdminNavbar({ handleLogout }) {
  return (
    <nav className="flex items-center px-8 h-14 justify-between border-b border-black/20">
      <div className="flex h-full items-center">
        <Link to={"__admin/dashboard"} className="text-xl font-medium">
          <img
            src="/assets/mutual_text_logo.svg"
            alt="mutaal_logo"
            className="w-20"
          />
        </Link>

        <div className="h-full hidden lg:inline">
          <div className="flex ml-6 h-full">
            <NavLink
              to={"/__admin/dashboard"}
              end
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
                  Dashboard
                </>
              )}
            </NavLink>
            <NavLink
              to={"/__admin/projects"}
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
                  Projects
                </>
              )}
            </NavLink>
            <NavLink
              to={"/__admin/influencers"}
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
                  KOL
                </>
              )}
            </NavLink>
            <NavLink
              to={"/__admin/message"}
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
        </div>
      </div>
      <Button
        onClick={handleLogout}
        color="default"
        className="text-xs rounded-full font-medium"
      >
        Logout
      </Button>
    </nav>
  );
}
