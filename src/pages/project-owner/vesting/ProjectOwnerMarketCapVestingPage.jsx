import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { shortenAddress } from "../../../utils/string";
import { Button } from "@nextui-org/react";

export default function ProjectOwnerMarketCapVestingPage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col py-20">
        <div className="flex items-center gap-3">
          <Link to="/project-owner/browse">
            <ArrowLeft className="size-8" />
          </Link>
          <h1 className="text-4xl font-medium">Marketcap Vesting</h1>
        </div>
        <div className="mt-6">
          <p>
            Unlock 20% of tokens right after the promotion is live. The
            remaining 80% will vest once your project reaches the agreed market
            cap milestones
          </p>
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

          {/* Token offer amount and percentage supply  */}
          <div className="w-full flex mt-4 gap-3">
            <div className="flex-1">
              <p>Token Offer Amount</p>
              <div className="bg-white rounded-xl border mt-1">
                <div className="px-5 py-5">
                  <input
                    className="outline-none text-2xl"
                    placeholder="1.000.000"
                  />
                </div>
                <div className="mt-2 w-full flex items-center justify-between">
                  <p className="text-sm text-neutral-400 px-4 py-2">
                    Balance: 8,000,000 $OCD
                  </p>
                  <div className="p-2">
                    <Button className="bg-orangy/10 text-orangy" size="sm">
                      Max
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p>Percentage of supply</p>
              <div className="bg-white rounded-xl border mt-1">
                <div className="px-2 py-5 w-full flex justify-center">
                  <input
                    className="outline-none text-2xl text-center"
                    placeholder="5%"
                  />
                </div>
                <div className="mt-2 w-full flex items-center justify-between">
                  <p className="text-sm text-neutral-400 px-4 py-2">
                    Balance: 8,000,000 $OCD
                  </p>
                  <div className="p-2">
                    <Button className="bg-orangy/10 text-orangy" size="sm">
                      Max
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
