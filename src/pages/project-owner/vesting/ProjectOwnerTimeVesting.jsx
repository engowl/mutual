import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { shortenAddress } from "../../../utils/string";
import {
  Button,
  DatePicker,
  Input,
  Textarea,
  TimeInput,
} from "@nextui-org/react";

const vestingPeriods = [
  {
    label: "1 Month",
    value: "1m",
  },
  {
    label: "2 Months",
    value: "2m",
  },
  {
    label: "3 Months",
    value: "3m",
  },
  {
    label: "6 Months",
    value: "6m",
  },
  {
    label: "1 Year",
    value: "1y",
  },
];

export default function ProjectOwnerTimeVestingPage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col py-20">
        <div className="flex items-center gap-3">
          <Link to="/project-owner/browse">
            <ArrowLeft className="size-8" />
          </Link>
          <h1 className="text-4xl font-medium">Time Vesting</h1>
        </div>
        <div className="mt-6">
          <p>
            Influencers receive 20% of their tokens upfront after completing
            their promotional tasks. The remaining 80% is vested over a set
            period (e.g., 30 days) and can be claimed daily, proportionate to
            the days passed.
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
                <div className="px-2 py-7 w-full flex justify-center">
                  <input
                    className="outline-none text-2xl text-center"
                    placeholder="5%"
                  />
                </div>
                <div className="w-full flex items-center justify-between gap-2 p-2">
                  {[0.05, 0.1, 0.2, 0.5, 1, 1.5].map((percent, idx) => (
                    <Button
                      key={idx}
                      className="bg-black/5 text-black text-xs h-6 min-w-0"
                      size="sm"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Market cap milestone */}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Vesting Period</p>
            <div className="w-full flex flex-wrap gap-1">
              {vestingPeriods.map((period, idx) => (
                <Button
                  key={idx}
                  className="bg-white rounded-xl border p-2 h-14 flex items-center gap-2 flex-1 justify-center"
                >
                  <p>{period.label}</p>
                </Button>
              ))}
            </div>
          </div>

          {/*Telegram admin username*/}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Telegram Admin Username</p>
            <div className="w-full flex flex-wrap gap-1">
              <Input
                variant="bordered"
                placeholder="Enter admin username"
                classNames={{
                  inputWrapper: "h-12 bg-white shadow-none border",
                }}
              />
            </div>
          </div>

          {/* Marketing Channel */}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Marketing Channel</p>
            <div className="w-full flex flex-wrap gap-2">
              <Button
                className="flex-1 bg-white h-20 border"
                variant="bordered"
              >
                X (Twitter) Post
              </Button>
              <Button
                className="flex-1 bg-white h-20 border"
                variant="bordered"
              >
                Telegram Channel Post
              </Button>
            </div>
          </div>

          {/*Promotional post text*/}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Promotional post text</p>
            <div className="w-full flex flex-wrap gap-1">
              <Textarea
                variant="bordered"
                placeholder="Enter admin username"
                classNames={{
                  inputWrapper: "bg-white shadow-none border p-4",
                }}
              />
            </div>
          </div>

          {/* Post date and time */}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p className="text-sm text-neutral-500">Post Date and Time</p>
            <div className="w-full flex gap-2">
              <DatePicker
                className="flex-1"
                variant="bordered"
                dateInputClassNames={{
                  inputWrapper: "h-12 bg-white shadow-none border",
                }}
              />
              <TimeInput
                classNames={{
                  inputWrapper: "h-12 bg-white shadow-none border",
                }}
                className="max-w-32"
                variant="bordered"
              />
            </div>
          </div>

          <div className="w-full flex justify-end mt-8">
            <Button
              size="lg"
              className="bg-orangy text-white px-8 rounded-full"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
