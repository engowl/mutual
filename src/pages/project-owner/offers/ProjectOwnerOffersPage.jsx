import { Button, Spinner } from "@nextui-org/react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { mutualAPI } from "../../../api/mutual";
import useSWR from "swr";
import OfferStatusBadgePill from "../../../components/offers/OfferStatusBadgePill";
import {
  CoinsIcon,
  HandGiveIcon,
  TelegramIcon,
  TwitterIcon,
} from "../../../components/icons/icons";

export default function ProjectOwnerOffersPage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <h1 className="text-3xl font-medium">Project Offers</h1>
        <OffersList />
      </div>
    </div>
  );
}

function getStatus(status) {
  switch (status) {
    case "sent":
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
    label: "Sent",
    value: "sent",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Past",
    value: "completed",
  },
  {
    label: "Rejected",
    value: "rejected",
  },
];

function OffersList() {
  const [searchParams, setSearchParams] = useSearchParams({
    status: "sent",
  });

  const { data, isLoading, mutate } = useSWR(
    "/campaign/orders",
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const status = searchParams.get("status");

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.filter((order) => order.status === getStatus(status));
  }, [data, status]);

  console.log({ filteredOrders }, "filtered orders");

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
      <div className="w-full mt-1 bg-white rounded-2xl border p-4 h-[600px] overflow-y-auto">
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

function OfferCard({ order }) {
  return (
    <Link
      to={`/project-owner/offers/${order.id}`}
      className="flex items-center gap-4 p-3 border rounded-lg justify-between hover:bg-neutral-100"
    >
      <div>
        <div className="flex flex-col items-start lg:flex-row gap-1 lg:items-center">
          <p className="font-medium">
            {order.token.name} (${order.token.symbol})
          </p>
          {/* Offers status pill */}
          <div className="lg:ml-4">
            <OfferStatusBadgePill status={order.status} />
          </div>
        </div>

        {/* Detail offers */}
        <div className="flex flex-wrap items-center gap-4 text-sm mt-4 text-neutral-500">
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
    </Link>
  );
}
