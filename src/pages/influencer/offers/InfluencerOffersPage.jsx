import { Button } from "@nextui-org/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK";
import { useCookies } from "react-cookie";
import { mutualAPI } from "../../../api/mutual";
import useSWR from "swr";

export default function InfluencerOffersPage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <h1 className="text-3xl font-medium">Project Offers</h1>
        <OffersList />
      </div>
    </div>
  );
}

function OffersList() {
  const [searchParams, setSearchParams] = useSearchParams({
    status: "new",
  });

  const { data } = useSWR("/campaign/orders", async (url) => {
    const { data } = await mutualAPI.get(url);
    return data;
  });

  console.log({ data }, "campaign order data");

  const status = searchParams.get("status");

  return (
    <div className="w-full flex flex-col mt-4">
      {/* tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setSearchParams({ status: "new" })}
          className={`py-2 flex justify-center rounded-lg ${
            searchParams.get("status") === "new"
              ? "text-black"
              : "text-neutral-500"
          }`}
        >
          New
        </button>
        <button
          onClick={() => setSearchParams({ status: "active" })}
          className={`py-2 flex justify-center rounded-lg ml-8 ${
            searchParams.get("status") === "active"
              ? "text-black"
              : "text-neutral-500"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setSearchParams({ status: "completed" })}
          className={`py-2 rounded-lg ml-8 ${
            searchParams.get("status") === "completed"
              ? "text-black"
              : "text-neutral-500"
          }`}
        >
          Completed
        </button>
      </div>
      <div className="w-full mt-1 bg-white rounded-2xl border p-4 h-[447px] overflow-y-auto">
        <OfferCard />
      </div>
    </div>
  );
}

function OfferCard() {
  const [cookie] = useCookies(["session_token"]);
  const [isLoading, setIsLoading] = useState(false);
  const handleAcceptOffer = async () => {
    try {
      setIsLoading(true);

      console.log("cookie.session_token", cookie.session_token);

      // Accept offer logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
      });

      await escrowSDK.acceptOffer("GQWKNiynk4S0NwPI");
      console.log("Offer accepted successfully");
    } catch (error) {
      console.error("Error accepting offer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    try {
      setIsLoading(true);

      console.log("cookie.session_token", cookie.session_token);

      // Reject offer logic here
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookie.session_token,
      });

      await escrowSDK.rejectOffer("6auUot2SiNy7oLAx");
      console.log("Offer rejected successfully");
    } catch (error) {
      console.error("Error rejecting offer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg justify-between">
      <div>
        <div className="flex items-center">
          <p className="font-medium">MICHI ($MICHI)</p>
          {/* Offers status pill */}
          <span className="ml-3 px-2 py-1 rounded-full bg-orangy/10 border border-orangy text-orangy text-xs">
            Waiting to Confirm
          </span>
        </div>

        {/* Detail offers */}
        <div className="flex items-center gap-4 text-sm mt-4 text-neutral-500">
          <div>
            <p>Direct Payment</p>
          </div>
          <div>
            <p>10 SOL</p>
          </div>
          <div>
            <p>Twitter Post</p>
          </div>
        </div>
      </div>
      {/* action buttons */}
      <div className="flex flex-col items-center">
        <div className="flex gap-2">
          <Button
            onClick={handleRejectOffer}
            isLoading={isLoading}
            color="default"
            className="text-xs rounded-full font-medium"
          >
            Decline
          </Button>
          <Button
            onClick={handleAcceptOffer}
            className="text-xs bg-orangy text-white rounded-full font-medium"
            isLoading={isLoading}
          >
            Accept
          </Button>
        </div>
        <p className="text-xs mt-3 text-neutral-500">Respond in 20:20:21</p>
      </div>
    </div>
  );
}
