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
import { useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from ".././../../utils/string";
import { Check, Clock, X } from "lucide-react";
import { cnm } from "../../../utils/style.js";
import dayjs from "dayjs";
import { DUMMY_LOGS } from "../../project-owner/offers/ProjectOwnerOffersDetailsPage.jsx";
import useSWR from "swr";
import { mutualAPI } from "../../../api/mutual";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK.js";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import Countdown from "react-countdown";
import { sleep } from "../../../utils/misc.js";
import SubmitProofModal from "../../../components/influencer/offers/SubmitWorkModal.jsx";
import { CHAINS } from "../../../config.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { NATIVE_MINT } from "@solana/spl-token";
import InfluencerOfferStatusBadgePill from "../../../components/offers/InfluencerOfferStatusBadgePill.jsx";
import DexScreenerLogo from "../../../assets/dexscreener.svg?react";

export default function InfluencerOffersDetailPage() {
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const { wallet } = useWallet();

  const [projectDetail, setProjectDetail] = useState(null);

  const offerId = params.id;

  const {
    data: offer,
    isLoading,
    mutate,
  } = useSWR(
    offerId ? `/campaign/${offerId}/detail` : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);

      // If there is data.post and data.post.isApproved is false, then it is waiting for approval
      if (data.post && data.post.isApproved === false) {
        setIsWaitingApproval(true);
      } else {
        setIsWaitingApproval(false);
      }

      return data;
    },
    {
      refreshInterval: 5000,
    }
  );

  useEffect(() => {
    if (offer) {
      console.log('data.projectOwner', offer.projectOwner)
      setProjectDetail(offer.projectOwner.projectDetails[0])
    }
  }, [offer])

  const {
    data: claimable,
    isLoading: isLoadingClaimable,
    mutate: mutateClaimable,
  } = useSWR(
    offerId ? `/campaign/${offerId}/claimable` : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    },
    {
      refreshInterval: 3000,
    }
  );

  const {
    data: events,
    isLoading: isLoadingEvents,
    mutate: mutateEvents,
  } = useSWR(
    offerId ? `/campaign/${offerId}/logs` : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    },
    {
      refreshInterval: 3000,
    }
  );

  console.log({ events, offer }, "events");

  const [cookie] = useCookies(["session_token"]);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [isAcceptLoading, setIsAcceptLoading] = useState(false);

  function mutateAllData() {
    mutate();
    mutateClaimable();
    mutateEvents();
  }

  const handleAcceptOffer = async () => {
    try {
      setIsAcceptLoading(true);

      console.log("cookie.session_token", cookie.session_token);

      // Accept offer logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
      });

      await escrowSDK.acceptOffer(offer.id);
      await sleep(2000);
      mutateAllData();
      console.log("Offer accepted successfully");
    } catch (error) {
      console.error("Error accepting offer:", error);
    } finally {
      setIsAcceptLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    try {
      setIsRejectLoading(true);

      console.log("cookie.session_token", cookie.session_token);

      // Reject offer logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
      });

      await escrowSDK.rejectOffer(offer.id);
      await sleep(2000);
      mutateAllData();
      console.log("Offer rejected successfully");
    } catch (error) {
      console.error("Error rejecting offer:", error);
    } finally {
      setIsRejectLoading(false);
    }
  };

  console.log({ claimable, offer }, "offer data");

  // Claiming
  const [isClaiming, setIsClaiming] = useState(false);
  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      console.log("Claiming...");

      // Claim logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
        chainId: "devnet",
        chains: CHAINS,
      });

      if (offer.token.mintAddress === NATIVE_MINT.toBase58()) {
        const resolveDealTx =
          await escrowSDK.prepareNativeResolveDealTransaction({
            orderId: offer.id,
            mintAddress: offer.token.mintAddress,
            kolAddress: wallet.adapter.publicKey.toBase58(),
            projectOwnerAddress: offer.projectOwner.user.wallet.address,
          });

        const signedTx = await wallet.adapter.signTransaction(resolveDealTx);
        const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);

        console.log("Claimed successfully", txHash);
      } else {
        const resolveDealTx = await escrowSDK.prepareResolveDealTransaction({
          orderId: offer.id,
          mintAddress: offer.token.mintAddress,
          kolAddress: wallet.adapter.publicKey.toBase58(),
          projectOwnerAddress: offer.projectOwner.user.wallet.address,
        });

        const signedTx = await wallet.adapter.signTransaction(resolveDealTx);
        const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);

        console.log("Claimed successfully", txHash);
      }

      await mutateClaimable();
    } catch (error) {
      console.error("Error claiming:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading || isLoadingClaimable) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center font-clash px-5">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-xl lg:text-3xl font-medium">Offers Detail</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/message/${offer?.projectOwner.userId}`)}
              color="default"
              className="rounded-full font-medium lg:px-8 text-xs md:text-base"
            >
              Message
            </Button>

            {offer?.status === "ACCEPTED" && (
              <SubmitProofModal orderId={offer.id} />
            )}

            {offer?.status === "CREATED" && (
              <>
                <Button
                  isLoading={isRejectLoading}
                  disabled={isRejectLoading || isAcceptLoading}
                  onClick={handleRejectOffer}
                  color="default"
                  className="rounded-full font-medium lg:px-8 text-xs md:text-base"
                >
                  Decline Offer
                </Button>
                <Button
                  isLoading={isAcceptLoading}
                  disabled={isRejectLoading || isAcceptLoading}
                  onClick={handleAcceptOffer}
                  className="bg-orangy text-white rounded-full font-medium lg:px-8 text-xs md:text-base"
                >
                  Accept Offer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Respond in */}
        {offer?.status === "CREATED" && (
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
        )}

        {projectDetail &&
          <div className="mt-4 p-4 rounded-xl bg-white border">
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <img
                  src={projectDetail.token.imageUrl}
                  alt="logo"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="text-xl lg:text-2xl font-medium">
                    ${projectDetail.token.symbol}
                  </div>
                  <p className="text-md">
                    {projectDetail.token.name}
                  </p>
                </div>

              </div>
              <a
                href={projectDetail.token.pair.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium"
              >
                <DexScreenerLogo />
              </a>
            </div>
            <div className="flex gap-7 mt-3 text-sm md:text-base">
              <div>
                <p className="text-orangy font-medium">$150M</p>
                <p className="text-xs md:text-sm text-neutral-500">Market Cap</p>
              </div>
              <div>
                <p className="text-orangy font-medium">
                  {shortenAddress(projectDetail.token.mintAddress)}
                </p>
                <p className="text-xs md:text-sm text-neutral-500">
                  Contract Address
                </p>
              </div>
              <div>
                <p className="text-orangy font-medium">
                  {projectDetail.token.totalSupply.toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-neutral-500">
                  Total Supply
                </p>
              </div>
            </div>
          </div>
        }

        {/* TODO add real first and second unlocks data */}
        <Unlock
          unlocks={claimable?.phases || []}
          handleClaim={handleClaim}
          isClaiming={isClaiming}
        />

        {/* Details */}
        <div className="mt-4 py-5 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div>
            <div className="flex flex-col gap-3 text-sm md:text-base">
              <div className="flex items-center">
                <p className="w-44 text-neutral-400">Status</p>
                <InfluencerOfferStatusBadgePill status={offer?.status} />
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
            {offer.post && (
              <>
                <p className="font-medium mt-6 md:mt-8">
                  Promotional post text
                </p>
                {/* TODO add promotional text real data */}
                <p className="mt-6 md:mt-8 text-sm md:text-base">
                  {offer?.post.text}
                </p>
              </>
            )}
          </div>
        </div>

        {offer && offer?.post && <SubmissionCard post={offer.post} />}

        <EventLogs events={events} />
      </div>
    </div>
  );
}

function SubmissionCard({ post }) {
  return (
    <div className="w-full mt-4 bg-white rounded-xl border p-4">
      <p className="font-medium">Your Submission</p>
      <p className="mt-1 text-sm text-neutral-400">
        The post you submitted for approval
      </p>
      <div className="px-4 py-2 rounded-full border mt-3">{post.postUrl}</div>

      {post.isApproved ? (
        <div className="bg-success-100 p-2 mt-2 rounded-lg">
          <p className="font-medium">Approved</p>
          <p className="text-sm opacity-60">
            Your submission has been approved by the project owner
          </p>
        </div>
      ) : (
        <div className="gap-2 mt-5 text-center opacity-60">
          Waiting for approval from the project owner
        </div>
      )}
    </div>
  );
}

function Unlock({ unlocks, handleClaim, isClaiming }) {
  console.log({ unlocks }, "unlocks data");

  return (
    <div className="flex flex-col md:flex-row gap-2 lg:gap-4 mt-2 lg:mt-4">
      {unlocks.map((unlock, index) => {
        return (
          <div
            key={index}
            className="relative flex gap-5 flex-1 items-center justify-between bg-white rounded-xl border p-4"
          >
            <div className="flex flex-col gap-0.5 text-[#161616]">
              <h1 className="font-medium">{unlock.phaseName}</h1>
              <p>{unlock.amountLabel}</p>
              <p className="text-sm">{unlock.conditionLabel}</p>
            </div>

            <Button
              isDisabled={!unlock.isClaimable}
              isLoading={isClaiming}
              onClick={handleClaim}
              className="bg-primary rounded-full text-white font-medium text-sm w-20 md:w-24"
            >
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
                  <div
                    className={cnm(
                      "flex items-center justify-center size-4 rounded-full  aspect-square",
                      "bg-orangy"
                    )}
                  >
                    <Check color="white" size={10} />
                  </div>
                  <div
                    className={cnm(
                      "h-full w-[2px] bg-orangy",
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

                {/* TODO change to mainnet in prod */}
                {event.txHash && (
                  <a
                    target="_blank"
                    href={`https://solscan.io/tx/${event.txHash}?cluster=devnet`}
                    className="my-auto ml-auto text-xs text-[#161616] hover:text-[#161616]/70 font-medium whitespace-nowrap underline"
                  >
                    View Transaction
                  </a>
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
