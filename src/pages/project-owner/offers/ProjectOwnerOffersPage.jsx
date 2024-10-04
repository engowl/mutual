import { Button } from "@nextui-org/react";
import { Link, useSearchParams } from "react-router-dom";

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

function OffersList() {
  const [searchParams, setSearchParams] = useSearchParams({
    status: "sent",
  });

  const status = searchParams.get("status");

  return (
    <div className="w-full flex flex-col mt-4">
      {/* tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setSearchParams({ status: "sent" })}
          className={`py-2 flex justify-center rounded-lg ${
            searchParams.get("status") === "sent"
              ? "text-black"
              : "text-neutral-500"
          }`}
        >
          Sent
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
          onClick={() => setSearchParams({ status: "past" })}
          className={`py-2 rounded-lg ml-8 ${
            searchParams.get("status") === "past"
              ? "text-black"
              : "text-neutral-500"
          }`}
        >
          Past
        </button>
      </div>
      <div className="w-full mt-1 bg-white rounded-2xl border p-4 h-[447px] overflow-y-auto">
        <OfferCard
          data={{
            id: 1,
          }}
        />
      </div>
    </div>
  );
}

function OfferCard({ data }) {
  return (
    <Link
      to={`/project-owner/offers/${data.id}`}
      className="flex items-center gap-4 p-3 border rounded-lg justify-between"
    >
      <div>
        <div className="flex items-center">
          <p className="font-medium">MICHI ($MICHI)</p>
          {/* Offers status pill */}
          <span className="ml-3 px-2 py-1 rounded-full bg-orangy/10 border border-orangy text-orangy text-xs">
            Waiting for confirmation
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
    </Link>
  );
}
