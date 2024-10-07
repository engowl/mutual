import { Button, Spinner } from "@nextui-org/react";
import { useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from ".././../../utils/string";
import { Check, Clock } from "lucide-react";
import Countdown from "react-countdown";
import { cnm } from "../../../utils/style.js";
import dayjs from "dayjs";
import { mutualAPI } from "../../../api/mutual.js";
import useSWR from "swr";
import OfferStatusBadgePill from "../../../components/offers/OfferStatusBadgePill.jsx";
import toast from "react-hot-toast";
import { useState } from "react";

export default function ProjectOwnerOffersDetailPage() {
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const params = useParams();
  const navigate = useNavigate();

  const offerId = params.id;

  const {
    data: offer,
    isLoading,
    mutate,
  } = useSWR(offerId ? `/campaign/${offerId}/detail` : null, async (url) => {
    const { data } = await mutualAPI.get(url);

    // If there is data.post and data.post.isApproved is false, then it is waiting for approval
    if (data.post && data.post.isApproved === false) {
      setIsWaitingApproval(true);
    } else {
      setIsWaitingApproval(false);
    }

    return data;
  }, {
    refreshInterval: 5000
  });

  const {
    data: claimable,
    isLoading: isLoadingClaimable,
    mutate: mutateClaimable,
  } = useSWR(offerId ? `/campaign/${offerId}/claimable` : null, async (url) => {
    const { data } = await mutualAPI.get(url);
    return data;
  });

  const [isApproving, setIsApproving] = useState(false);
  const handleApproveWork = async () => {
    try {
      setIsApproving(true);
      const res = await mutualAPI.post(
        '/campaign/approve-work',
        {
          orderId: offer.id
        }
      )

      console.log({ res })

      await mutate()

      toast.success("Work approved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve work");
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading || isLoadingClaimable) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center font-clash">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-medium">Offers Detail</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/message/${offer?.influencer.userId}`)}
              color="default"
              className="rounded-full font-medium px-8"
            >
              Message
            </Button>
            {isWaitingApproval && (
              <Button
                onClick={handleApproveWork}
                className="bg-orangy text-white rounded-full font-medium px-8"
                isLoading={isApproving}
              >
                Approve Work
              </Button>
            )}
          </div>
        </div>

        {/* Respond in */}
        {offer?.status === "CREATED" &&
          <div className="mt-10 py-3 px-4 rounded-xl bg-white border flex items-center justify-between">
            <div className="font-medium flex items-center gap-2">
              <Clock className="size-4" />
              Respond in:
            </div>
            <div className="font-medium">
              <Countdown
                date={new Date(offer?.expiredAtUnix * 1000)}
                daysInHours
              />
            </div>
          </div>
        }

        <div className="mt-4 p-4 rounded-xl bg-white border">
          <div className="w-full flex items-center justify-between">
            <p className="text-2xl font-medium">
              {offer?.token.name} (${offer?.token.symbol})
            </p>
            <div className="font-medium">DexScreener</div>
          </div>
          <div className="flex gap-7 mt-3">
            <div>
              <p className="text-orangy font-medium">$150M</p>
              <p className="text-sm text-neutral-500">Market Cap</p>
            </div>
            <div>
              <p className="text-orangy font-medium">
                {shortenAddress(offer?.token.mintAddress)}
              </p>
              <p className="text-sm text-neutral-500">Contract Address</p>
            </div>
            <div>
              <p className="text-orangy font-medium">
                {" "}
                {offer?.token.totalSupply}
              </p>
              <p className="text-sm text-neutral-500">Total Supply</p>
            </div>
          </div>
        </div>
        {/* Details */}
        <div className="mt-4 py-5 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Status</p>
                <OfferStatusBadgePill status={offer?.status} />
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Offer Amount</p>
                <p className="font-medium">
                  {offer?.tokenAmount} {offer?.token.symbol}
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Payment Terms</p>
                <p className="font-medium">
                  {offer.vestingType === "MARKETCAP"
                    ? "Market Cap Vesting"
                    : offer.vestingType === "TIME"
                      ? "Time Vesting"
                      : "Direct Payment"}
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Marketing Channel</p>
                <p className="font-medium">
                  {offer.channel === "TWITTER" ? "Twitter" : "Telegram"} Post
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Schedule</p>
                <p className="font-medium">
                  {/* TODO add real postDateandTime */}
                  {dayjs().utc().format("D MMMM YYYY : HH:mm [UTC]")}
                </p>
              </div>
            </div>
            <p className="font-medium mt-8">Promotional post text</p>
            <p className="mt-8">
              🚀 $Michi is ready to take over the crypto space!🔥 Join the
              $Michi revolution and be part of the most exciting meme coin of
              the year! 📈 Strong community, rapid growth, and big plans ahead!
            </p>
          </div>
        </div>

        {(offer && offer.post) &&
          <SubmissionCard
            post={offer.post}
          />
        }

        <EventLogs events={DUMMY_LOGS} />
      </div>
    </div>
  );
}

function SubmissionCard({
  post
}) {
  return (
    <div className="w-full mt-4 bg-white rounded-xl border p-4">
      <p className="font-medium">Submission</p>
      <p className="mt-1 text-sm text-neutral-400">
        Please review and approve influencer submissions for your project
      </p>
      <div className="px-4 py-2 rounded-full border mt-3">
        {post.postUrl}
      </div>

      {post.isApproved ?
        <div className="bg-success-100 p-2 mt-2 rounded-lg">
          <p className="font-medium">Approved</p>
          <p className="text-sm opacity-60">The submission has been approved</p>
        </div>
        :
        <div className="flex gap-2 mt-5">
          <Button color="default" className="rounded-full font-medium px-8">
            Decline
          </Button>
          <Button className="bg-orangy text-white rounded-full font-medium px-8">
            Approve Work
          </Button>
        </div>
      }
    </div>
  );
}

function EventLogs({ events }) {
  return (
    <div className="relative flex flex-col gap-5 w-full mt-4 bg-white rounded-xl border p-4">
      <p className="font-medium">Activity</p>

      <div className="flex flex-col">
        {events.map((event, index) => {
          return (
            <div key={event.id} className="flex flex-col w-full px-4">
              <div className="flex flex-row items-start gap-4 h-full w-full">
                <div className="flex flex-col h-full items-center mt-0.5">
                  <div
                    className={cnm(
                      "flex items-center justify-center size-4 rounded-full  aspect-square",
                      `${index === 0 ? "bg-orangy" : "bg-[#D9D9D9]"}`
                    )}
                  >
                    {index === 0 && <Check color="white" size={10} />}
                  </div>
                  <div
                    className={cnm(
                      "h-full w-[2px] bg-[#D9D9D9]",
                      `${index === events.length - 1 ? "hidden" : ""}`
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2 pb-5">
                  <p className="text-sm text-[#161616]">
                    {dayjs(event.time).format("MMM D, YYYY [at] h:mm A")}
                  </p>
                  <h1 className="text-md font-medium text-[#161616]">
                    {event.description}
                  </h1>
                </div>

                {event.txHash && (
                  <button
                    onClick={() =>
                      window.open(`https://solscan.io/tx/${event.txHash}`)
                    }
                    className="my-auto ml-auto text-xs text-[#161616] hover:text-[#161616]/70 font-medium whitespace-nowrap underline"
                  >
                    View Transaction
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const DUMMY_LOGS = [
  {
    id: "created_offer",
    title: "Offer Created",
    description:
      "An offer was submitted with Market-cap vesting terms for $MUTUAL.",
    time: "2024-10-06T19:01:33.617Z",
    txHash:
      "2z1szYnKuB1QpWw5eafWTfrnZyCMCj6ngNsjL3jxWdHUfonMZzPSzkMKP9G2YSTuVuzuAEQbjP9chqApBLQtEHsP",
  },
  {
    id: "accepted_offer",
    description: "The offer has been accepted. The post is scheduled for ...",
    time: "2024-10-06T20:21:10.986Z",
    txHash: null,
  },
  {
    id: "partially_eligible",
    description:
      "The tweet has been verified, the first unlock is now available for claiming.",
    time: "2024-10-06T20:21:14.142Z",
    txHash:
      "5M755wbCF2PxKDVHodg3fsdEvVitPLBAxx2u7pGEQsvGBNU6FvzwaaxRnDHXzCe3fgKfuiw8QbRNV34pAy5QEKqj",
  },
  {
    id: "partial_deal_resolved_pnL",
    description: "A partial unlock of 250 $MUTUAL has been claimed.",
    time: "2024-10-06T20:21:17.316Z",
    txHash:
      "5PQ94Duw3jJL6p2K6iPqR4pnesq8d8Bu6zHwrpScp4TJQb8yF3SMKCjAwknZCDVSgbQVJ849YHQKaWMzGNPyobYB",
  },
  {
    id: "fully_eligible",
    description:
      "$MUTUAL has reached the target market cap! All remaining tokens are now available for claiming.",
    time: "2024-10-06T20:21:18.141Z",
    txHash:
      "4ibC2f71LzTFcFBspMjehu5ocnQnyu9JPSgvR3ayGaqUG3gE3Gmn2CcbUJ2aM9tUMb4qiDiCu5RcWCLYqZzJvjUA",
  },
  {
    id: "deal_resolved",
    description: "All 1000 $MUTUAL has been claimed.",
    time: "2024-10-06T20:21:20.249Z",
    txHash:
      "5US6j9QbjVg97hfhBzoH9fDnaQECs5r4EBJ4HPHrXkKhsGPRRGXrxctUsTDzzbsCVJev8VGyheVQG1dbCZ68zJMf",
  },
  {
    id: "completed_offer",
    description: "The offer is completed. All tokens have been released.",
    time: "2024-10-06T20:21:20.249Z",
    txHash: null,
  },
];
