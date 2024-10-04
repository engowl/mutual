import { Button, Input } from "@nextui-org/react";
import IconicButton from "../../components/ui/IconicButton";
import { useState } from "react";

export default function ProjectOwnerRegisterPage() {
  const [onProcess, setOnProcess] = useState(false);

  if (onProcess) {
    return <OnProcessBanner />;
  }

  return (
    <div className="w-full lg:h-full flex items-center justify-center lg:overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row lg:h-full">
        {/* Banner */}

        <div className="h-64 w-full lg:h-full lg:w-[610px] overflow-hidden relative">
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
                onClick={() => setOnProcess(true)}
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
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-5">
      <div className="flex flex-col items-center">
        <div className="size-14 rounded-full bg-neutral-200"></div>
        <p className="text-2xl font-medium mt-4 text-center">
          Hang tight, we’re reviewing <br className="inline md:hidden" /> your
          project! 😉
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
