import { useNavigate } from "react-router-dom";
import MCWidget from "../lib/mconnect/components/MCWidget.jsx";
import { useMCAuth } from "../lib/mconnect/hooks/useMCAuth.jsx";
import { useEffect, useState } from "react";
import influencerSvg from "../assets/register-page/influencer.svg";
import projectOwnerSvg from "../assets/register-page/project-owner.svg";
import { mutualAPI } from "../api/mutual.js";
import { Spinner } from "@nextui-org/react";
import AsciiFlame from "../lib/mconnect/components/AsciiFlame.jsx";

export default function IndexPage() {
  const {
    isLoggedIn,
    getUser,
    user,
    isCheckingSession,
    isUserLoading,
    isWalletLoading,
    isLoggingIn,
    isGoogleLoading,
  } = useMCAuth();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");

  useEffect(() => {
    if (user && isLoggedIn && user.role) {
      let url = "";

      if (user.role === "INFLUENCER") {
        url = `/register/influencer`;
      } else if (user.role === "PROJECT_OWNER") {
        url = `/register/project-owner`;
      }

      if (code) {
        url += `?code=${code}`;
      }

      navigate(url);
    }
  }, [code, isLoggedIn, navigate, user]);

  if (
    isCheckingSession ||
    isUserLoading ||
    isWalletLoading ||
    isLoggingIn ||
    isGoogleLoading
  )
    return (
      <div className="w-full flex items-center justify-center min-h-full bg-creamy px-5 md:px-10 py-12">
        <Spinner size="xl" color="primary" />
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-5 items-center justify-center min-h-full bg-creamy px-5 md:px-10 pt-12 pb-20">
      <div className="size-20">
        <img
          src="public/assets/mutual_logo.svg"
          alt="ic"
          className="object-contain w-full h-full"
        />
      </div>

      <div className="fixed pointer-events-none bottom-0 w-full h-[20vh]">
        <AsciiFlame />
      </div>

      <>
        {isLoggedIn && user ? (
          <ChooseRole user={user} getUser={getUser} />
        ) : (
          <MCWidget />
        )}
      </>
    </div>
  );
}

function ChooseRole({ getUser }) {
  const [loading, setLoading] = useState(false);

  const updateRole = async (role) => {
    setLoading(true);

    try {
      await mutualAPI.post("/users/update", {
        role,
      });

      await getUser({ silentLoad: true });
    } catch (error) {
      console.log("ERROR_UPDATE_ROLE: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center z-10 relative">
      <h1 className="text-3xl lg:text-4xl font-medium text-center">
        Get Started by Choosing Your Role
      </h1>
      {loading ? (
        <div className="mt-7 flex items-center gap-8 h-72">
          <Spinner
            size="xl"
            color="primary"
            className="flex items-center justify-center w-full"
          />
        </div>
      ) : (
        <div className="mt-7 grid md:grid-cols-2 gap-8">
          <button
            onClick={() => updateRole("INFLUENCER")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 max-w-[300px] overflow-hidden"
          >
            <div className="w-64 h-56">
              <img
                src={influencerSvg}
                alt="influencer-svg"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-medium mt-4">Influencer</h3>
            <p className="text-sm text-neutral-400 text-center">
              Set your price and add details for promotional posts on Twitter or
              Telegram.
            </p>
          </button>
          <button
            onClick={() => updateRole("PROJECT_OWNER")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 max-w-[300px] overflow-hidden"
          >
            <div className="w-56 h-56">
              <img
                src={projectOwnerSvg}
                alt="project-owner-svg"
                className="w-full h-full object-contain mt-3"
              />
            </div>
            <h3 className="text-2xl font-medium mt-4">Project Owner</h3>
            <p className="text-sm text-neutral-400 text-center">
              Create your campaign and define your budget for influencer
              partnerships.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
