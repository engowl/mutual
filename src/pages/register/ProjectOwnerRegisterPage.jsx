import { Button, Input } from "@nextui-org/react";
import IconicButton from "../../components/ui/IconicButton";
import { useEffect, useState } from "react";
import { useMCAuth } from "../../lib/mconnect/hooks/useMcAuth.jsx";
import { useNavigate } from "react-router-dom";
import { mutualAPI } from "../../api/mutual.js";
import Lottie from "react-lottie";

import animationData from "../../assets/lottie-loading.json";

export default function ProjectOwnerRegisterPage() {
  const [onProcess, setOnProcess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, user, getUser } = useMCAuth();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tw, setTw] = useState("");
  const [ca, setCa] = useState("");
  const [tl, setTl] = useState("");
  const [group, setGroup] = useState("");

  useEffect(() => {
    if (user && user.projectOwner) {
      if (user.projectOwner.status === "APPROVED") {
        navigate("/success");
      } else {
        setOnProcess(true);
      }
    }
  }, [navigate, onProcess, user]);

  useEffect(() => {
    if (isLoggedIn) {
      getUser();
    }

    if (onProcess) {
      const interval = setInterval(() => {
        getUser();
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [getUser, isLoggedIn, onProcess]);

  if (onProcess) {
    return <OnProcessBanner />;
  }

  async function submit() {
    setLoading(true);
    try {
      await mutualAPI.post("/users/update", {
        projectOwner: {
          telegramAdmin: tl,
          projectDetail: {
            projectName: name,
            contractAddress: ca,
            twitterLink: tw,
            telegramGroupLink: group,
          },
        },
      });
      getUser();
    } catch (error) {
      console.log("ERROR_UPDATE_ROLE: ", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full lg:h-full flex items-center justify-center lg:overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row lg:h-full">
        {/* Banner */}

        <div className="hidden lg:flex h-full w-[610px] overflow-hidden relative">
          <img
            src="/assets/register-page/project-owner-banner.png"
            alt="project-owner-banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 lg:overflow-y-auto">
          <div className="w-full max-w-3xl flex flex-col items-start px-8 py-12">
            <h1 className="text-4xl font-medium">Your Project Details</h1>
            <div className="mt-8 w-full flex flex-col gap-7">
              {/* Project name */}
              <div className="flex flex-col gap-1 w-full">
                <label>Project Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Project Name"
                  variant="bordered"
                  classNames={{
                    inputWrapper:
                      "border rounded-lg h-12 border-black/10 shadow-none",
                    input: "placeholder:opacity-50",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label>Project Twitter Link</label>
                <Input
                  value={tw}
                  onChange={(e) => setTw(e.target.value)}
                  placeholder="e.g https://twitter.com/johndoe"
                  variant="bordered"
                  classNames={{
                    inputWrapper:
                      "border rounded-lg h-12 border-black/10 shadow-none",
                    input: "placeholder:opacity-50",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label>Project Contract Address</label>
                <Input
                  value={ca}
                  onChange={(e) => setCa(e.target.value)}
                  placeholder="Enter contract address"
                  variant="bordered"
                  classNames={{
                    inputWrapper:
                      "border rounded-lg h-12 border-black/10 shadow-none",
                    input: "placeholder:opacity-50",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label>Telegram Admin Username</label>
                <Input
                  value={tl}
                  onChange={(e) => setTl(e.target.value)}
                  placeholder="Enter admin username"
                  variant="bordered"
                  classNames={{
                    inputWrapper:
                      "border rounded-lg h-12 border-black/10 shadow-none",
                    input: "placeholder:opacity-50",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label>Project Telegram Group Link</label>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Enter Group Link"
                  variant="bordered"
                  classNames={{
                    inputWrapper:
                      "border rounded-lg h-12 border-black/10 shadow-none",
                    input: "placeholder:opacity-50",
                  }}
                />
              </div>
            </div>

            <div className="mt-7 w-full flex justify-end">
              <IconicButton
                className={"rounded-full border-orangy"}
                arrowBoxClassName={"rounded-full bg-orangy"}
                onClick={submit}
                isLoading={loading}
              >
                <p className="group-hover:text-white transition-colors text-orangy px-4">
                  Continue
                </p>
              </IconicButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnProcessBanner() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center text-center px-5 md:px-10">
      <div className="flex flex-col items-center">
        <div className="size-[16rem] md:size-[20rem]">
          <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
        </div>

        <p className="text-2xl font-medium mt-4">
          Hang tight, we’re reviewing your project! 😉
        </p>
        <p className="text-neutral-500 mt-8">Need help?</p>
        <Button
          size="lg"
          className="bg-orangy text-white mt-5 rounded-full font-medium"
        >
          Contact Admin
        </Button>
      </div>
    </div>
  );
}
