import { Button, Spinner } from "@nextui-org/react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK";
import { useCookies } from "react-cookie";
import { mutualAPI } from "../../../api/mutual";
import useSWR from "swr";
import OfferStatusBadgePill from "../../../components/offers/OfferStatusBadgePill";
import Countdown from "react-countdown";
import {
  TelegramIcon,
  TwitterIcon,
  CoinsIcon,
  HandGiveIcon,
} from "../../../components/icons/icons";

export default function InfluencerOffersPage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <h1 className="text-3xl font-medium">Project Offers</h1>
        <OffersList />
      </div>
    </div>
  );
}

function getStatus(status) {
  switch (status) {
    case "new":
      return "CREATED";
    case "active":
      return "ACCEPTED";
    case "completed":
      return "COMPLETED";
    case "rejected":
      return "REJECTED";
    default:
      return null;
  }
}

const statusFilter = [
  {
    label: "New",
    value: "new",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Completed",
    value: "completed",
  },
  {
    label: "Rejected",
    value: "rejected",
  },
];

function OffersList() {
  const [searchParams, setSearchParams] = useSearchParams({
    status: "new",
  });

  const status = searchParams.get("status");

  const { data, isLoading, mutate } = useSWR(
    "/campaign/orders",
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.filter((order) => order.status === getStatus(status));
  }, [data, status]);

  console.log({ data }, "campaign order data");

  return (
    <div className="w-full flex flex-col mt-4">
      {/* tabs */}
      <div className="flex items-center gap-5">
        {statusFilter.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSearchParams({ status: filter.value })}
            className={`py-2 flex justify-center rounded-lg ${
              searchParams.get("status") === filter.value
                ? "text-black"
                : "text-neutral-500"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="w-full mt-1 bg-white rounded-2xl border p-4 h-[447px] overflow-y-auto">
        {!isLoading ? (
          <>
            {filteredOrders.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                No offers available
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                {filteredOrders.map((order) => (
                  <OfferCard key={order.id} order={order} mutate={mutate} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Spinner size="md" color="primary" />
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({ order, mutate }) {
  console.log({ order }, "order");

  const [cookie] = useCookies(["session_token"]);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [isAcceptLoading, setIsAcceptLoading] = useState(false);
  const handleAcceptOffer = async () => {
    try {
      setIsAcceptLoading(true);

      console.log("cookie.session_token", cookie.session_token);

      // Accept offer logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
      });

      await escrowSDK.acceptOffer(order.id);
      setTimeout(() => {
        mutate();
      }, 2000);
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

      await escrowSDK.rejectOffer(order.id);
      console.log("Offer rejected successfully");
    } catch (error) {
      console.error("Error rejecting offer:", error);
    } finally {
      setIsRejectLoading(false);
    }
  };

  return (
    <Link
      to={`/influencer/offers/${order.id}`}
      className="flex items-center gap-4 p-3 border rounded-lg justify-between hover:bg-neutral-100"
    >
      <div>
        <div className="flex items-center">
          <p className="font-medium">
            {order.token.name} (${order.token.symbol})
          </p>
          {/* Offers status pill */}
          <div className="ml-4">
            <OfferStatusBadgePill status={order.status} />
          </div>
        </div>

        {/* Detail offers */}
        <div className="flex items-center gap-4 text-sm mt-4 text-neutral-500">
          <div className="flex items-center gap-1">
            <HandGiveIcon className="mb-0.5" />
            <p>
              {order.vestingType === "MARKETCAP"
                ? "Market Cap Vesting"
                : order.vestingType === "TIME"
                ? "Time Vesting"
                : "Direct Payment"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <CoinsIcon className="mb-0.5" />
            <p>
              {order.tokenAmount} ${order.token.symbol}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {order.channel === "TWITTER" ? <TwitterIcon /> : <TelegramIcon />}
            <p>{order.channel === "TWITTER" ? "Twitter" : "Telegram"} Post</p>
          </div>
        </div>
      </div>
      {/* action buttons */}
      {order.status !== "REJECTED" && (
        <div className="flex flex-col items-center">
          <div className="flex gap-2">
            <Button
              onClick={handleRejectOffer}
              isLoading={isRejectLoading}
              color="default"
              className="text-xs rounded-full font-medium"
            >
              Decline
            </Button>
            <Button
              onClick={handleAcceptOffer}
              className="text-xs bg-orangy text-white rounded-full font-medium"
              isLoading={isAcceptLoading}
            >
              Accept
            </Button>
          </div>
          <p className="text-xs mt-3 text-neutral-500">
            Respond in{" "}
            <Countdown date={new Date(Date.now() + 50000)} daysInHours />
          </p>
        </div>
      )}
    </Link>
  );
}
