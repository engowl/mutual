import { Button } from "@nextui-org/react";
import { useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from ".././../../utils/string";
import { Check, Clock } from "lucide-react";
import Countdown from "react-countdown";
import { cnm } from "../../../utils/style.js";
import dayjs from "dayjs";

export default function ProjectOwnerOffersDetailPage() {
  const params = useParams();
  const isWaitingApproval = true;
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center font-clash">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-medium">Offers Detail</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                navigate(`/project-owner/message?influencerId=${3232323}`);
              }}
              color="default"
              className="rounded-full font-medium px-8"
            >
              Message
            </Button>
            {isWaitingApproval && (
              <Button className="bg-orangy text-white rounded-full font-medium px-8">
                Approve Work
              </Button>
            )}
          </div>
        </div>

        {/* Respond in */}
        <div className="mt-10 py-3 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div className="font-medium flex items-center gap-2">
            <Clock className="size-4" />
            Respond in:
          </div>
          <div className="font-medium">
            <Countdown date={Date.now() + 30000} daysInHours />
          </div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white border">
          <div className="w-full flex items-center justify-between">
            <p className="text-2xl font-medium">MICHI ($MICHI)</p>
            <div className="font-medium">DexScreener</div>
          </div>
          <div className="flex gap-7 mt-3">
            <div>
              <p className="text-orangy font-medium">$150M</p>
              <p className="text-sm text-neutral-500">Market Cap</p>
            </div>
            <div>
              <p className="text-orangy font-medium">
                {shortenAddress("0x8ad8asfha8f8iaf")}
              </p>
              <p className="text-sm text-neutral-500">Contract Address</p>
            </div>
            <div>
              <p className="text-orangy font-medium">821,893,121</p>
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
                <div className="text-xs text-orangy bg-orangy/10 rounded-full px-2 py-1 border border-orangy">
                  Waiting for Confirmation
                </div>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Offer Amount</p>
                <p className="font-medium">20 SOL</p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Payment Terms</p>
                <p className="font-medium">Direct Payment</p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Marketing Channel</p>
                <p className="font-medium">Twitter Post</p>
              </div>
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Schedule</p>
                <p className="font-medium">15 October 2024 : 18:00 UTC</p>
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
        {isWaitingApproval && <SubmissionCard />}
        <EventLogs events={DUMMY_LOGS} />
      </div>
    </div>
  );
}

function SubmissionCard() {
  return (
    <div className="w-full mt-4 bg-white rounded-xl border p-4">
      <p className="font-medium">Submission</p>
      <p className="mt-1 text-sm text-neutral-400">
        Please review and approve influencer submissions for your project
      </p>
      <div className="px-4 py-2 rounded-full border mt-3">
        https://twitter.com/johndoe
      </div>
      <div className="flex gap-2 mt-5">
        <Button color="default" className="rounded-full font-medium px-8">
          Decline
        </Button>
        <Button className="bg-orangy text-white rounded-full font-medium px-8">
          Approve Work
        </Button>
      </div>
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
