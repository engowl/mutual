import { useCallback, useEffect, useState } from "react";
import { mutualPublicAPI } from "../../../api/mutual.js";
import { cnm } from "../../../utils/style.js";
import RandomAvatar from "../../../components/ui/RandomAvatar.jsx";
import { Spinner } from "@nextui-org/react";
import twitterSvg from "../../../assets/twitter.svg";
import telegramSvg from "../../../assets/admin/ic-telegram.svg";
import campaignSvg from "../../../assets/admin/ic_round-campaign.svg";
import historySvg from "../../../assets/admin/ic_round-history.svg";
import { Link } from "react-router-dom";

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInfluencers = useCallback(
    async ({ withLoading = true } = {}) => {
      try {
        if (withLoading) {
          setLoading(true);
        }
        const response = await mutualPublicAPI.get(`/__admin/influencers`);
        setInfluencers(response.data.data.influencers);
        setCount(response.data.data.influencersCount);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [setInfluencers, setCount, setLoading]
  );

  useEffect(() => {
    fetchInfluencers();

    const interval = setInterval(() => {
      fetchInfluencers({
        withLoading: false,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchInfluencers]);

  return (
    <div className="flex flex-col items-center min-h-screen w-full px-5">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="flex flex-col">
          <h1 className="text-3xl font-medium">KOL List</h1>
          <p className="text-[#575757]">{count} Total influencers</p>
        </div>
        <InfluencersList influencers={influencers} loading={loading} />
      </div>
    </div>
  );
}

function InfluencersList({ influencers, loading }) {
  return (
    <div className="w-full flex flex-col mt-4 font-medium">
      <div className="w-full mt-1 bg-white rounded-2xl border h-[447px] overflow-y-auto">
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-full">
            <Spinner size="xl" color="primary" />
          </div>
        ) : (
          influencers.map((influencer, index) => {
            return (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                isLastIndex={index === influencers.length - 1}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function InfluencerCard({ influencer, isLastIndex }) {
  return (
    <Link
      to={`${influencer.id}`}
      className={cnm(
        "flex items-center gap-4 py-6",
        `${isLastIndex ? "" : "border-b-[1px]"}`
      )}
    >
      <div className="flex items-center gap-4 justify-between px-6 w-full">
        <div className="flex items-center gap-4 w-full">
          <div className="size-11 rounded-full overflow-hidden">
            {influencer?.twitterAccount?.profileImageUrl ? (
              <img
                src={influencer?.twitterAccount?.profileImageUrl}
                alt="ic"
                className="h-full w-full"
              />
            ) : (
              <RandomAvatar seed={influencer.id} className="w-full h-full" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex gap-4">
                <h1>{influencer?.twitterAccount?.name}</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `https://x.com/${influencer?.twitterAccount?.username}`
                      )
                    }
                    className="size-5"
                  >
                    <img src={twitterSvg} alt="ic" className="h-full w-full" />
                  </button>
                  <button
                    onClick={() => window.open(influencer?.telegramLink)}
                    className="size-5"
                  >
                    <img src={telegramSvg} alt="ic" className="h-full w-full" />
                  </button>
                </div>
              </div>
            </div>

            <p>{influencer?.twitterAccount?.username}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center justify-end w-full">
          <div className="flex gap-2 items-center">
            <div className="rounded-full size-10 flex items-center justify-center aspect-square border-[1px] border-[#D9D9D9] p-2">
              <img src={campaignSvg} alt="ic" className="h-full w-full" />
            </div>

            <div className="flex flex-col">
              <p>{influencer.activeCampaigns}</p>
              <p className="text-xs text-[#575757]">Active Campaigns</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-full size-10 flex items-center justify-center aspect-square border-[1px] border-[#D9D9D9] p-2">
              <img src={historySvg} alt="ic" className="h-full w-full" />
            </div>

            <div className="flex flex-col">
              <p>{influencer.pastCampaigns}</p>
              <p className="text-xs text-[#575757]">Past Campaigns</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
