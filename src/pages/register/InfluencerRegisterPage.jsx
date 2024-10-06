import { Button, Checkbox, Input, Textarea } from "@nextui-org/react";
import { useAtom, useAtomValue } from "jotai";
import { Newspaper, Package, UserCircle } from "lucide-react";
import { influencerRegisterStepAtom } from "../../store/register-page-store";
import { cnm } from "../../utils/style";
import { useNavigate } from "react-router-dom";

import twitterSvg from "../../assets/twitter.svg";
import { useCallback, useEffect, useState } from "react";
import { mutualAPI } from "../../api/mutual.js";
import IconicButton from "../../components/ui/IconicButton.jsx";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth.jsx";

export default function InfluencerRegisterPage() {
  const [step, setStep] = useAtom(influencerRegisterStepAtom);
  const { user } = useMCAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.influencer?.twitterAccount) {
      if (
        user.influencer.projectCriterias &&
        user.influencer.projectCriterias.length > 0
      ) {
        if (user.influencer.packages && user.influencer.packages.length > 0) {
          console.log("Navigate to profile");
          navigate("/influencer/profile");
        } else {
          setStep(3);
        }
      } else {
        setStep(2);
      }
    }
  }, [user, navigate, setStep]);

  return (
    <div className="w-full h-full flex items-center justify-center px-5 xl:px-10">
      <div className="w-full flex items-center max-w-7xl h-full flex-col xl:flex-row">
        {/* Register steps indicator */}
        <div className="flex flex-row xl:flex-col gap-3.5 pt-12 xl:pt-0 xl:h-full justify-center items-center xl:items-start text-[10px] md:text-sm xl:text-sm">
          <div
            className={cnm(
              "flex items-center",
              step >= 1 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <UserCircle className="size-5 xl:size-6" />
            <p className="font-medium ml-3 xl:ml-4 text-center">
              Connect <br className="inline xl:hidden" /> Social Media
            </p>
          </div>
          <div className="w-5 xl:w-6 flex justify-center items-center">
            <div
              className={cnm(
                "w-full h-[1px] xl:w-[1px] rounded-full xl:h-10",
                step >= 2 ? "bg-orangy" : "bg-neutral-400"
              )}
            ></div>
          </div>
          <div
            className={cnm(
              "flex items-center",
              step >= 2 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <Newspaper className="size-5 xl:size-6" />
            <p className="font-medium ml-3 xl:ml-4">
              Project <br className="inline xl:hidden" /> Criteria
            </p>
          </div>
          <div className="w-5 xl:w-6 flex justify-center items-center">
            <div
              className={cnm(
                "w-full h-[1px] xl:w-[1px] rounded-full xl:h-10",
                step >= 2 ? "bg-orangy" : "bg-neutral-400"
              )}
            ></div>
          </div>
          <div
            className={cnm(
              "flex items-center",
              step >= 3 ? "text-orangy" : "text-neutral-400"
            )}
          >
            <Package className="size-5 xl:size-6" />
            <p className="font-medium ml-3 xl:ml-4">
              Package <br className="inline xl:hidden" /> and Pricing
            </p>
          </div>
        </div>
        <div className="xl:ml-32 xl:h-full xl:overflow-y-auto xl:flex-1">
          <div className="py-12 xl:py-20 w-full flex flex-col items-start">
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
  const [isTwitterLoading, setTwitterLoading] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [userTwitter, setUserTwitter] = useState(null);
  const [telegramLink, setTelegramLink] = useState("");
  const { getUser } = useMCAuth();

  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");

  const connectTwitter = async () => {
    setTwitterLoading(true);

    try {
      const res = await mutualAPI.get("/users/twitter/authorize");

      window.location.replace(res.data.data.redirectUrl);
    } catch (error) {
      console.log(error);
    } finally {
      setTwitterLoading(false);
    }
  };

  const getTwitterUser = useCallback(async (code) => {
    setTwitterLoading(true);

    try {
      const res = await mutualAPI.post("/users/twitter/connect", {
        code: code,
      });

      setUserTwitter(res.data.data.userTwitter);
    } catch (error) {
      console.log("Error connect twitter: ", error);
    } finally {
      setTwitterLoading(false);
    }
  }, []);

  const saveSocials = async () => {
    if (userTwitter && telegramLink) {
      setLoading(true);

      try {
        await mutualAPI.post("/users/update", {
          influencer: {
            userTwitter: userTwitter,
            telegramLink: telegramLink,
          },
        });
        await getUser();
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (code) {
      getTwitterUser(code);
    }
  }, [code, getTwitterUser]);

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl xl:text-4xl font-medium">Connect Your Socials</h1>
      <div className="mt-14 flex flex-col gap-6">
        <div>
          <p className="text-lg font-medium">Twitter</p>
          <div className="flex items-center gap-3 mt-3">
            {userTwitter && userTwitter.username ? (
              <div className="bg-[#F7F8FA]  flex gap-2 items-center shrink-0 rounded-full px-5 py-2 w-fit">
                <img src={twitterSvg} />
                Connected @{userTwitter.username}
              </div>
            ) : (
              <Button
                onClick={connectTwitter}
                isLoading={isTwitterLoading}
                className="bg-[#F7F8FA] shrink-0 rounded-full w-fit"
              >
                <img src={twitterSvg} />
                Connect with Twitter
              </Button>
            )}
          </div>
        </div>
        <div>
          <p className="text-lg font-medium">Telegram</p>
          <div className="flex items-center gap-3 mt-3">
            <Input
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="Enter Telegram link"
              className="xl:min-w-96"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={saveSocials}
          isLoading={isLoading}
          className="bg-orangy text-white rounded-full mt-6 px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function ProjectCriteria() {
  const [selectedRisk, setSelectedRisk] = useState({
    id: "LOW",
    label: "🐢 Low Risk",
  });

  const [selectedTokenAge, setSelectedTokenAge] = useState({
    id: "LESS_THAN_SEVEN_WEEKS",
    label: "Less than 7 days",
  });

  const [minMc, setMinMc] = useState("");
  const [maxMc, setMaxMc] = useState("");
  const [min24Vol, setMin24Vol] = useState("");
  const [tokenHolder, setTokenHolder] = useState("");
  const [liquiditySize, setLiquiditySize] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { getUser } = useMCAuth();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await mutualAPI.post("/users/update", {
        influencer: {
          projectCriteria: {
            riskPreference: selectedRisk.id,
            tokenAge: selectedTokenAge.id,
            minMarketCap: parseFloat(minMc),
            maxMarketCap: parseFloat(maxMc),
            min24hVolume: parseFloat(min24Vol),
            tokenHolder: parseInt(tokenHolder),
            liquiditySize: parseFloat(liquiditySize),
          },
        },
      });

      getUser();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div>
        <h1 className="text-3xl xl:text-4xl font-medium">
          Set Your Risk Profile
        </h1>
        <p className="mt-5 text-neutral-500 text-sm xl:text-base">
          Define your risk preferences so that your profile and pricing are only
          shown to projects that meet your criteria. This will ensure that
          you&apos;re matched with projects that align with your requirements.
        </p>
        <div className="w-full mt-6">
          <p>Risk Preference</p>
          <div className="mt-2 bg-white rounded-full p-1 flex w-full text-xs xl:text-base">
            {RISKS.map((risk) => {
              return (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRisk(risk)}
                  className={`cursor-pointer flex-1 flex justify-center py-1.5 rounded-full ${
                    selectedRisk.id == risk.id ? "bg-orangy/20" : ""
                  } transition-colors duration-200`}
                >
                  {risk.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Market Cap Range</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="Min"
              className="flex-1"
              type="number"
              value={minMc}
              onChange={(e) => setMinMc(e.target.value)}
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
            <div className="flex items-center justify-center h-[1px] w-6 bg-black"></div>
            <Input
              placeholder="Max"
              className="flex-1"
              type="number"
              value={maxMc}
              onChange={(e) => setMaxMc(e.target.value)}
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Token Age</p>
          <div className="mt-2 flex flex-col gap-3">
            {TOKEN_AGES.map((age) => {
              return (
                <div key={age.id} className="flex items-center gap-1">
                  <Checkbox
                    isSelected={selectedTokenAge?.id === age.id}
                    onChange={() => setSelectedTokenAge(age)}
                  />
                  <p>{age.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full mt-6">
          <p>Minimum 24-hour trading volume</p>
          <div className="mt-2 flex w-full gap-3 items-center">
            <Input
              placeholder="e.g 1000000"
              className="flex-1"
              type="number"
              value={min24Vol}
              onChange={(e) => setMin24Vol(e.target.value)}
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
              type="number"
              value={tokenHolder}
              onChange={(e) => setTokenHolder(e.target.value)}
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
              type="number"
              value={liquiditySize}
              onChange={(e) => setLiquiditySize(e.target.value)}
              classNames={{
                inputWrapper: "border border-black/10 rounded-lg h-12",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6 justify-end">
        {/* <Button
          onClick={() => setStep(1)}
          color="default"
          className="rounded-full"
        >
          Back
        </Button> */}
        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          className="bg-orangy text-white rounded-full px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function PackageAndPricing() {
  const { getUser } = useMCAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState([
    {
      title: "Tweet Post",
      subtitle: "Add price and details for one posting on Twitter",
      type: "TWITTER",
      price: "",
      description: "",
    },
    {
      title: "Telegram Group Post",
      subtitle: "Add price and details for one posting on Telegram channel",
      type: "TELEGRAM_GROUP",
      price: "",
      description: "",
    },
  ]);

  const handleInputChange = (index, field, value) => {
    const updatedPackages = [...packages];
    updatedPackages[index][field] = value;
    setPackages(updatedPackages);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const parsedPackages = packages.map((pkg) => ({
        ...pkg,
        price: parseFloat(pkg.price) || 0,
      }));

      await mutualAPI.post("/users/update", {
        influencer: {
          packages: parsedPackages,
        },
      });

      await getUser();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="w-full">
        <h1 className="text-3xl xl:text-4xl font-medium">Set Your Package</h1>

        <div className="mt-12 flex flex-col xl:flex-row gap-6 w-full">
          {/* Tweet post package input*/}
          {packages.map((pkg, index) => (
            <div key={index} className="bg-white rounded-2xl border p-6 flex-1">
              <p className="font-medium">{pkg.title}</p>
              <p className="text-xs text-neutral-500">{pkg.subtitle}</p>
              <div className="w-full flex items-center justify-between mt-8">
                <input
                  value={pkg.price}
                  type="number"
                  onChange={(e) =>
                    handleInputChange(index, "price", e.target.value)
                  }
                  className="text-4xl font-medium outline-none placeholder:text-neutral-300 max-w-64 text-orangy"
                  placeholder="0.00"
                />
                <p className="text-3xl font-medium">SOL</p>
              </div>
              <div className="mt-6">
                <p>Description</p>
                <Textarea
                  value={pkg.description}
                  onChange={(e) =>
                    handleInputChange(index, "description", e.target.value)
                  }
                  placeholder="Enter your description"
                  variant="bordered"
                  className="mt-2"
                  classNames={{
                    inputWrapper:
                      "bg-creamy-50 border-black/10 border p-4 rounded-lg",
                    input: "placeholder:text-neutral-400",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          {/* <Button
            onClick={() => setStep(2)}
            color="default"
            className="rounded-full"
          >
            Back
          </Button> */}

          <IconicButton
            onClick={handleSubmit}
            className={"rounded-full border-orangy"}
            arrowBoxClassName={"rounded-full bg-orangy"}
            isLoading={isLoading}
          >
            <p className="group-hover:text-white transition-colors text-orangy pl-3 pr-4">
              Set Profile
            </p>
          </IconicButton>
        </div>
      </div>
    </div>
  );
}

const RISKS = [
  {
    id: "LOW",
    label: "🐢 Low Risk",
  },
  {
    id: "MODERATE",
    label: "🦉 Moderate",
  },
  {
    id: "HIGH",
    label: "🧨 High Risk",
  },
  // {
  //   id: "CUSTOM",
  //   label: "🎨 Custom",
  // },
];

const TOKEN_AGES = [
  {
    id: "LESS_THAN_SEVEN_WEEKS",
    label: "Less than 7 days",
  },
  {
    id: "ONE_TO_FOUR_WEEKS",
    label: "1-4 weeks",
  },
  {
    id: "ONE_TO_THREEE_MONTHS",
    label: "1-3 months",
  },
  {
    id: "MORE_THAN_THREE_MONTHS",
    label: "More than 3 months",
  },
];
