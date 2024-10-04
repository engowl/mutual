import { useNavigate } from "react-router-dom";
import MCWidget from "../lib/mconnect/components/MCWidget.jsx";
import { useMCAuth } from "../lib/mconnect/hooks/useMcAuth.jsx";
import { useEffect, useState } from "react";
import influencerSvg from "../assets/register-page/influencer.svg";
import projectOwnerSvg from "../assets/register-page/project-owner.svg";
import { mutualAPI } from "../api/mutual.js";
import { Spinner } from "@nextui-org/react";

export default function IndexPage() {
  const { isLoggedIn, user, getUser } = useMCAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "INFLUENCER") {
        navigate("/register/influencer");
      } else if (user.role === "PROJECT_OWNER") {
        navigate("/register/project-owner");
      }
    }
  }, [navigate, user]);

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-creamy">
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
      getUser();
    } catch (error) {
      console.log("ERROR_UPDATE_ROLE: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl px-5 md:px-10">
      <h1 className="text-4xl font-medium text-center">
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
          <button
            onClick={() => updateRole("INFLUENCER")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 h-full"
          >
            <img
              src={influencerSvg}
              className="object-contain w-full h-full max-w-[8rem] mb-4"
            />
            <h3 className="text-2xl font-medium mt-auto">Influencer</h3>
            <p className="text-sm text-neutral-400 text-center">
              Set your price and add details for promotional posts on Twitter or
              Telegram.
            </p>
          </button>

          <button
            onClick={() => updateRole("PROJECT_OWNER")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-neutral-50 h-full"
          >
            <img
              src={projectOwnerSvg}
              className="object-contain w-full h-full max-w-[10rem] mb-4"
            />
            <h3 className="text-2xl font-medium mt-auto">Project Owner</h3>
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
