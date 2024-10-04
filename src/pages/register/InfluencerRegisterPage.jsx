import { Button, Checkbox, Input } from "@nextui-org/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Newspaper, Package, UserCircle } from "lucide-react";
import { influencerRegisterStepAtom } from "../../store/register-page-store";
import { cnm } from "../../utils/style";

export default function InfluencerRegisterPage() {
  const [step, setStep] = useAtom(influencerRegisterStepAtom);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full flex items-center max-w-7xl h-full">
        {/* Register steps indicator */}
        <div className="flex flex-col gap-3.5 h-full justify-center">
          <button
            onClick={() => setStep(1)}
            className={cnm(
              "flex items-center",
              step >= 1 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <UserCircle size={24} />
            <p className="font-medium ml-4">Connect Social Media</p>
          </button>
          <div className="w-6 flex justify-center">
            <div
              className={cnm(
                "w-[1px] rounded-full h-10",
                step >= 2 ? "bg-orangy" : "bg-neutral-400"
              )}
            ></div>
          </div>
          <button
            onClick={() => setStep(2)}
            className={cnm(
              "flex items-center",
              step >= 2 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <Newspaper size={24} />
            <p className="font-medium ml-4">Project Criteria</p>
          </button>
          <div className="w-6 flex justify-center">
            <div
              className={cnm(
                "w-[1px] rounded-full h-10",
                step >= 3 ? "bg-orangy" : "bg-neutral-400"
              )}
            ></div>
          </div>
          <button
            onClick={() => setStep(3)}
            className={cnm(
              "flex items-center",
              step >= 3 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <Package size={24} />
            <p className="font-medium ml-4">Package and Pricing</p>
          </button>
        </div>
        <div className="ml-32 h-full overflow-y-auto flex-1">
          <div className="py-20 w-full flex flex-col items-start">
            <RegisterStep />
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterStep() {
  const step = useAtomValue(influencerRegisterStepAtom);
  switch (step) {
    case 1:
      return <ConnectSocialMedia />;
    case 2:
      return <ProjectCriteria />;
    case 3:
      return <PackageAndPricing />;
  }
}

function ConnectSocialMedia() {
  const setStep = useSetAtom(influencerRegisterStepAtom);

  return (
    <div className="flex flex-col">
      <h1 className="text-4xl font-medium">Connect Your Socials</h1>
      <div className="mt-14 flex flex-col gap-6">
        <div>
          <p className="text-lg font-medium">Twitter</p>
          <div className="flex items-center gap-3 mt-3">
            <Button className="bg-blue-400 text-white shrink-0">
              Connect with Twitter
            </Button>
            <p>or</p>
            <Input placeholder="Enter Twitter link" className="min-w-96" />
          </div>
        </div>
        <div>
          <p className="text-lg font-medium">Telegram</p>
          <div className="flex items-center gap-3 mt-3">
            <Button className="bg-blue-500 text-white shrink-0">
              Connect with Telegram
            </Button>
            <p>or</p>
            <Input placeholder="Enter Telegram link" className="min-w-96" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => setStep(2)}
          className="bg-orangy text-white rounded-full mt-6 px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
function ProjectCriteria() {
  const setStep = useSetAtom(influencerRegisterStepAtom);
  return (
    <div className="w-full max-w-2xl">
      <div>
        <h1 className="text-4xl font-medium">Set Your Risk Profile</h1>
        <p className="mt-5 text-neutral-500">
          Define your risk preferences so that your profile and pricing are only
          shown to projects that meet your criteria. This will ensure that
          you&apos;re matched with projects that align with your requirements.
        </p>
        <div className="w-full mt-6">
          <p>Risk Preference</p>
          <div className="mt-2 bg-white rounded-full p-1 flex w-full">
            <div className="flex-1 flex justify-center py-1.5 bg-orangy/20 rounded-full">
              🐢 Low Risk
            </div>
            <div className="flex-1 flex justify-center py-1.5">🦉 Moderate</div>
            <div className="flex-1 flex justify-center py-1.5">
              🧨 High Risk
            </div>
            <div className="flex-1 flex justify-center py-1.5">🎨 Custom</div>
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Market Cap Range</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="Min"
              className="flex-1"
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
            <div className="flex items-center justify-center h-[1px] w-6 bg-black"></div>
            <Input
              placeholder="Max"
              className="flex-1"
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Token Age</p>
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <Checkbox />
              <p>Less than 7 days</p>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox />
              <p>Less than 7 days</p>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox />
              <p>Less than 7 days</p>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox />
              <p>Less than 7 days</p>
            </div>
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Minimum 24-hour trading volume</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="e.g 1000000"
              className="flex-1"
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Token Holder</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="Enter Token Holder"
              className="flex-1"
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Liquidity Size</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="Enter Liquidity Size"
              className="flex-1"
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6 justify-end">
        <Button
          onClick={() => setStep(1)}
          color="default"
          className="rounded-full"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          className="bg-orangy text-white rounded-full px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function PackageAndPricing() {
  return (
    <div className="w-full max-w-xl">
      <div>
        <h1 className="text-4xl font-medium">Set Your Package</h1>

        <div className="mt-12 flex gap-8"></div>
      </div>
    </div>
  );
}
