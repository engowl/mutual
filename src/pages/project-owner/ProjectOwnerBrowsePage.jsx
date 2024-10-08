import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { shortenAddress } from "../../utils/string";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import GrowthIconSvg from "../../assets/project-owner/browse/growth.svg";
import PeopleIconSvg from "../../assets/project-owner/browse/people-fill.svg";
import PriceIconSvg from "../../assets/project-owner/browse/price-tag.svg";
import TimeVestingSvg from "../../assets/project-owner/browse/time-vest.svg";
import MarketVestingSvg from "../../assets/project-owner/browse/market-vest.svg";
import { Link, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { mutualAPI } from "../../api/mutual";
import RandomAvatar from "../../components/ui/RandomAvatar";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth.jsx";

export default function ProjectOwnerBrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [followersRange, setFollowersRange] = useState([0, 1000000]);
  const [budgetRange, setBudgetRange] = useState([0, 1000000]);

  const { user } = useMCAuth();

  const { data, isLoading } = useSWR("/influencer/all", async (url) => {
    const { data } = await mutualAPI.get(url);
    return data;
  });

  const { data: tokenInfo, isLoading: isTokenLoading } = useSWR(
    `/token/info?tokenAddress=${user?.projectOwner?.projectDetails[0]?.contractAddress}`,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const handleFollowersRangeChange = (min, max) => {
    setFollowersRange([min, max === 1000000 ? undefined : max]);
  };

  const handleBudgetRangeChange = (min, max) => {
    setBudgetRange([min, max === 1000000 ? undefined : max]);
  };

  const filteredInfluencers = data?.data?.filter((influencer) => {
    const matchesSearchQuery =
      influencer.twitterAccount.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      influencer.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.twitterAccount.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const withinFollowersRange =
      influencer.twitterAccount.followersCount >= followersRange[0] &&
      (followersRange[1] === undefined ||
        influencer.twitterAccount.followersCount <= followersRange[1]);

    const withinBudgetRange =
      influencer.packages.price >= budgetRange[0] &&
      (budgetRange[1] === undefined ||
        influencer.packages.price <= budgetRange[1]);

    return matchesSearchQuery && withinFollowersRange && withinBudgetRange;
  });

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-full">
        <Spinner size="xl" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center font-clash px-5">
      <div className="w-full max-w-6xl flex flex-col py-20">
        <div className="w-full flex flex-col lg:flex-row gap-5 lg:items-center justify-between">
          <h1 className="text-3xl lg:text-[2.5rem] font-medium">
            Find your ideal influencer
          </h1>
          <Input
            variant="bordered"
            classNames={{
              inputWrapper:
                "h-10 lg:h-12 bg-[#F6F6F6] border border-black/10 shadow-none rounded-lg ",
              input: "text-sm lg:text-base",
            }}
            className="w-full max-w-xs"
            startContent={<Search className="size-5" />}
            placeholder="KOL Name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full flex gap-6 mt-6">
          {/* Sidebar */}
          <div className="hidden xl:inline bg-white rounded-2xl border p-5 w-80 min-h-[400px]">
            {tokenInfo && !isTokenLoading ? (
              <div className="bg-orangy rounded-2xl p-4 text-white flex flex-col gap-2">
                <div className="w-full flex justify-between items-center">
                  <p className="text-neutral-100">${tokenInfo?.symbol}</p>
                </div>
                {tokenInfo?.imageUrl ? (
                  <div className="size-12 rounded-full overflow-hidden">
                    <img
                      src={tokenInfo.imageUrl}
                      alt="ic"
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="size-12 bg-neutral-100 rounded-full"></div>
                )}
                <p className="font-medium text-xl">{tokenInfo?.name}</p>
                <p className="text-neutral-100">
                  {shortenAddress(tokenInfo?.mintAddress)}
                </p>
              </div>
            ) : (
              <div className="bg-orangy rounded-2xl p-4 text-white flex items-center justify-center w-full h-40 gap-2">
                <Spinner size="md" color="white" />
              </div>
            )}
            <div className="mt-6">
              <div className="w-full flex items-center justify-between">
                <p className="font-medium">Filter</p>
                {/* <button
                  onClick={() => {
                    setFollowersRange([0, 1000000]);
                    setBudgetRange([0, 1000000]);
                  }}
                  className="text-orangy hover:text-orangy/80 text-sm"
                >
                  Reset
                </button> */}
              </div>
              <div className="mt-4">
                <BudgetRangeSlider onRangeChange={handleBudgetRangeChange} />
              </div>
              <div className="mt-4">
                <FollowersRangeSlider
                  onRangeChange={handleFollowersRangeChange}
                />
              </div>
            </div>
          </div>

          {/* Influencer list */}
          {filteredInfluencers && (
            <div className="flex-1">
              {filteredInfluencers.length === 0 ? (
                <div className="w-full flex items-center justify-center h-96">
                  <p>No influencers found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredInfluencers.map((influencer) => (
                    <InfluencerCard
                      key={influencer.id}
                      influencerData={influencer}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfluencerCard({ influencerData }) {
  const navigate = useNavigate();
  console.log({ influencerData });
  return (
    <div className="bg-white rounded-2xl border p-4 w-full">
      <div className="flex w-full gap-2 md:gap-4">
        <div className="shrink-0 size-16 md:size-20 rounded-full bg-neutral-200 overflow-hidden">
          {influencerData.twitterAccount.profileImageUrl ? (
            <img
              src={influencerData.twitterAccount.profileImageUrl}
              alt="profile"
              className="w-full h-full"
            />
          ) : (
            <RandomAvatar
              seed={influencerData.twitterAccount.username ?? "1"}
              className="w-full h-full"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="w-full flex items-center justify-between">
            <div>
              <p className="md:text-lg font-medium">
                @{influencerData.twitterAccount.username}
              </p>
              <p className="text-sm">{influencerData.user.name}</p>
            </div>
            {/* Best match badge */}
            <div className="bg-gradient-to-br from-[#8E00C5] via-[#FF6E63] to-[#FFA427] px-3 py-1 rounded-full text-[10px] md:text-xs text-white">
              Best Match
            </div>
          </div>
          {/* buttons */}
          <div className="w-full flex gap-1 mt-2 md:mt-4">
            <OffersTokenDealsModal influencerData={influencerData} />
            <Button
              onClick={() => {
                navigate(`/influencer/profile/${influencerData.id}`);
              }}
              variant="bordered"
              className="text-[10px] lg:text-xs bg-transparent border text-black rounded-full h-8 flex-1"
            >
              Package
            </Button>
            <a
              href={`https://x.com/${influencerData.twitterAccount.username}`}
              target="_blank"
              className="border size-8 rounded-full p-0 min-w-max shrink-0 flex items-center justify-center hover:bg-neutral-100"
            >
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full flex justify-start gap-10 mt-8">
        <div>
          <div className="size-10 rounded-full border flex items-center justify-center">
            <img src={PeopleIconSvg} alt="icon" className="size-4" />
          </div>
          <p className="font-medium text-sm leading-none mt-2">
            {influencerData.twitterAccount.followersCount?.toLocaleString() ||
              0}
          </p>
          <p className="text-xs mt-1">Followers</p>
        </div>
        {/* <div>
          <div className="size-10 rounded-full border flex items-center justify-center">
            <img src={RankIconSvg} alt="icon" className="size-4" />
          </div>
          <p className="font-medium text-sm leading-none mt-2">81.2K</p>
          <p className="text-xs mt-1">Followers</p>
        </div> */}
        <div>
          <div className="size-10 rounded-full border flex items-center justify-center">
            <img src={GrowthIconSvg} alt="icon" className="size-4" />
          </div>
          {/* TODO: KOL Success Rate */}
          <p className="font-medium text-sm leading-none mt-2">100%</p>
          <p className="text-xs mt-1">Success</p>
        </div>
        <div>
          <div className="size-10 rounded-full border flex items-center justify-center">
            <img src={PriceIconSvg} alt="icon" className="size-4" />
          </div>
          <p className="font-medium text-sm leading-none mt-2">
            {influencerData?.packages?.price} SOL
          </p>
          <p className="text-xs mt-1">Min. Price</p>
        </div>
      </div>
    </div>
  );
}

function OffersTokenDealsModal({ influencerData }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleOpen = () => {
    onOpen();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="text-[10px] lg:text-xs bg-orangy text-white rounded-full h-8 flex-1"
      >
        Offer Token Deals
      </Button>
      <Modal size={"xl"} isOpen={isOpen} onClose={onClose} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <button
                onClick={onClose}
                className="size-8 rounded-full absolute top-4 right-4 flex items-center justify-center"
              >
                <X className="size-5 text-neutral-400 stroke-2 hover:text-neutral-600" />
              </button>
              <ModalHeader className="pt-6">
                <div>
                  <div className="shrink-0 size-16 rounded-full bg-neutral-200 overflow-hidden">
                    {influencerData.twitterAccount.profileImageUrl ? (
                      <img
                        src={influencerData.twitterAccount.profileImageUrl}
                        alt="profile"
                        className="w-full h-full"
                      />
                    ) : (
                      <RandomAvatar
                        seed={influencerData.twitterAccount.username ?? "1"}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <p className="text-xl font-medium mt-2">
                    Offer Token Deals to @
                    {influencerData.twitterAccount.username}
                  </p>
                  <p className="text-base font-normal text-neutral-500">
                    Engage Influencers with Fair, Incentive-Based Vesting
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="w-full pb-6">
                <div>
                  <div className="w-full flex flex-col lg:flex-row gap-3 mt-3">
                    <Link
                      to={`/project-owner/market-cap-vesting/${influencerData.id}`}
                      className="border rounded-xl p-6 flex-1 flex flex-col items-center hover:bg-creamy-200"
                    >
                      <div>
                        <img
                          src={MarketVestingSvg}
                          alt="market-vest"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xl font-medium mt-8">
                        Marketcap Vesting
                      </p>
                      <p className="text-center text-sm mt-2">
                        20% of tokens are given after post, while the remaining
                        80% unlock when the project hits specific market cap
                        milestones.
                      </p>
                    </Link>
                    <Link
                      to={`/project-owner/time-vesting/${influencerData.id}`}
                      className="border rounded-xl p-6 flex-1 flex flex-col items-center hover:bg-creamy-200"
                    >
                      <div>
                        <img
                          src={TimeVestingSvg}
                          alt="market-vest"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xl font-medium mt-8">Time Vesting</p>
                      <p className="text-center text-sm mt-2">
                        50% of tokens are released upfront after promotion, with
                        the remaining 50% claimable daily over a set period.
                      </p>
                    </Link>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

function BudgetRangeSlider({ onRangeChange }) {
  return (
    <div className="w-full">
      <p>Budget</p>
      <div className="mt-3 w-full">
        <GraphRangeSlider
          initialMax={5000000}
          initialMin={0}
          step={0.0001}
          onRangeChange={onRangeChange}
        />
      </div>
    </div>
  );
}
function FollowersRangeSlider({ onRangeChange }) {
  return (
    <div className="w-full">
      <p>Followers</p>
      <div className="mt-3 w-full">
        <GraphRangeSlider
          initialMax={5000000}
          initialMin={1}
          step={1}
          onRangeChange={onRangeChange}
        />
      </div>
    </div>
  );
}

function EngagementRangeSlider({ onRangeChange }) {
  return (
    <div className="w-full">
      <p>Success</p>
      <div className="mt-3 w-full">
        <GraphRangeSlider initialMax={1} initialMin={1} step={100} />
      </div>
    </div>
  );
}

function GraphRangeSlider({
  initialMin = 0,
  initialMax = 100,
  step = 10,
  onRangeChange,
}) {
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);

  const barHeights = useMemo(() => {
    const heights = [];
    const minHeight = 6; // Minimum height percentage
    const barCount = 38; // Number of bars
    for (let i = 0; i < barCount; i++) {
      const expHeight =
        ((Math.exp(i / 10) - 1) / (Math.exp(4) - 1)) * (100 - minHeight);
      const height = Math.min(100, minHeight + expHeight);
      heights.push(height);
    }
    return heights;
  }, []);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxValue - 1);
    setMinValue(value);
    onRangeChange(value, maxValue);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minValue + 1);
    setMaxValue(value);
    onRangeChange(minValue, value);
  };

  const handleMinInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    const numValue = Math.min(Number(value), maxValue - step);
    if (!isNaN(numValue) && numValue >= 0) {
      setMinValue(numValue);
    }
    onRangeChange(value, maxValue);
  };

  const handleMaxInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    const numValue = Math.max(Number(value), minValue + step);
    if (!isNaN(numValue) && numValue <= initialMax) {
      setMaxValue(numValue);
    }
    onRangeChange(minValue, value);
  };

  const normalizeValue = (value, min, max) => {
    return ((value - min) / (max - min)) * 100;
  };

  // Memoize normalized min and max values
  const normalizedMinValue = useMemo(
    () => normalizeValue(minValue, initialMin, initialMax),
    [minValue, initialMin, initialMax]
  );
  const normalizedMaxValue = useMemo(
    () => normalizeValue(maxValue, initialMin, initialMax),
    [maxValue, initialMin, initialMax]
  );

  return (
    <div className="w-full">
      <div className="px-0.5">
        <div className="relative h-24">
          {barHeights.map((height, index) => (
            <div
              key={index}
              className="absolute bottom-0 bg-orangy rounded-t shrink-0"
              style={{
                height: `${height}%`,
                left: `${(index / barHeights.length) * 100}%`,
                width: `${60 / barHeights.length}%`, // Reduced width to create space
                opacity:
                  index >= (normalizedMinValue / 100) * barHeights.length &&
                  index <= (normalizedMaxValue / 100) * barHeights.length
                    ? 1
                    : 0.3,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative pt-1 -mt-1">
        {/* Slider for Min and Max */}
        <input
          type="range"
          min={initialMin}
          max={maxValue - step}
          value={minValue}
          onChange={handleMinChange}
          step={step}
          className="absolute top-1 left-0 w-full h-[2px] appearance-none rounded-full"
          style={{
            background: `linear-gradient(
              to right,
              rgba(249, 115, 22, 0.1) 0%, 
              rgba(249, 115, 22, 0.1) ${normalizedMinValue}%, 
              #FF4D06 ${normalizedMinValue}%, 
              #FF4D06 ${normalizedMaxValue}%, 
              rgba(249, 115, 22, 0.1) ${normalizedMaxValue}%, 
              rgba(249, 115, 22, 0.1) 100%
            )`,
          }}
        />
        <input
          type="range"
          min={initialMin}
          max={initialMax}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute top-1 left-0 w-full h-1 bg-transparent appearance-none"
        />

        {/* Manual Input for Min and Max */}
        <div className="relative mt-4">
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <Input
                value={minValue}
                variant="bordered"
                classNames={{
                  inputWrapper: "w-24 rounded-lg border shadow-none",
                }}
                onChange={handleMinInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Input
                variant="bordered"
                classNames={{
                  inputWrapper: "w-24 rounded-lg border shadow-none",
                }}
                value={maxValue}
                onChange={handleMaxInputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
