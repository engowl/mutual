import { Button } from "@nextui-org/react";
import { useParams } from "react-router-dom";
import { shortenAddress } from ".././../../utils/string";
import { Clock } from "lucide-react";
import { cnm } from "../../../utils/style.js";
import dayjs from "dayjs";
import { DUMMY_LOGS } from "../../project-owner/offers/ProjectOwnerOffersDetailsPage.jsx";

export default function InfluencerOffersDetailPage() {
  const params = useParams();
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center font-clash">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-medium">Offers Detail</h1>
          <div className="flex gap-2">
            <Button color="default" className="rounded-full font-medium px-8">
              Decline Offer
            </Button>
            <Button className="bg-orangy text-white rounded-full font-medium px-8">
              Accept Offer
            </Button>
          </div>
        </div>

        {/* Respond in */}
        <div className="mt-10 py-3 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div className="font-medium flex items-center gap-2">
            <Clock className="size-4" />
            Respond in:
          </div>
          <div className="font-medium">12:04:05</div>
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

        <Unlock unlocks={DUMMY_UNLOCKS} />

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

        <EventLogs events={DUMMY_LOGS} />
      </div>
    </div>
  );
}

function Unlock({ unlocks }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {unlocks.map((unlock, index) => {
        return (
          <div
            key={index}
            className="relative flex gap-5 w-full items-center justify-between mt-4 bg-white rounded-xl border p-4"
          >
            <div className="flex flex-col gap-0.5 text-[#161616]">
              <h1 className="font-medium">{unlock.title}</h1>
              <p>
                {unlock.value} {unlock.symbol}
              </p>
              <p>{unlock.conditionLabel}</p>
            </div>

            <Button className="bg-[#C9C9C9] rounded-full text-white font-medium text-sm w-24">
              Claim
            </Button>
          </div>
        );
      })}
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
                  <div className="size-4 rounded-full bg-orangy aspect-square"></div>
                  <div
                    className={cnm(
                      "h-full w-[2px] bg-orangy/50",
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

const DUMMY_UNLOCKS = [
  {
    title: "First Unlock",
    value: 1000,
    symbol: "$MICHI",
    conditionLabel: "Claim after first tweet",
  },
  {
    title: "Second Unlock",
    value: 8000,
    symbol: "$MICHI",
    conditionLabel: "Unlocks at $200M market cap",
  },
];
