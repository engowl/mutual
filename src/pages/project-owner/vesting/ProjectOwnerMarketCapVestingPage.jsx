import {
  Button,
  DatePicker,
  Input,
  Textarea,
  TimeInput,
} from "@nextui-org/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { Link } from "react-router-dom";
import IconicButton from "../../../components/ui/IconicButton";
import { CHAINS } from "../../../config";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK";
import { getAlphanumericId, sleep } from "../../../utils/misc";
import { shortenAddress } from "../../../utils/string";

export default function ProjectOwnerMarketCapVestingPage() {
  const [step, setStep] = useState(1);
  switch (step) {
    case 1:
      return <MarketCapVestingForm setStep={setStep} />;
    case 2:
      return <MarketCapVestingConfirmation />;
  }
}


function MarketCapVestingConfirmation() {
  const { wallet } = useWallet();
  const [cookies] = useCookies(["session_token"]);

  const [isLoading, setIsLoading] = useState(false);
  const handleCreateOffer = async () => {
    try {
      setIsLoading(true);

      console.log('cookies:', cookies);
      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: cookies.session_token,
        chainId: 'devnet',
        chains: CHAINS
      });

      const DUMMY_DEAL_DATA = {
        orderId: "abcd1234abcd1235",
        influencerId: "1",
        vestingType: "TIME",
        vestingCondition: {
          vestingDuration: "1-month"
        },
        chainId: "devnet",
        mintAddress: "6EXeGq2NuPUyB9UFWhbs35DBieQjhLrSfY2FU3o9gtr7",
        tokenAmount: 1000000,
        campaignChannel: "TWITTER",
        promotionalPostText: "heheheh",
        postDateAndTime: "2024-10-05T09:38:20.972Z"
      };

      // Step 1: Verify the offer
      await escrowSDK.verifyOffer(DUMMY_DEAL_DATA);
      console.log('Offer is valid!');

      // Step 2: Prepare the transaction to create the deal
      const createDealTx = await escrowSDK.prepareCreateDealTransaction({
        orderId: getAlphanumericId(16), // Random orderId, must be 16 characters alphanumeric
        mintAddress: DUMMY_DEAL_DATA.mintAddress,
        kolAddress: "3AYyQGgCCZXNhagbBBcYRM47jvzBw1Ev5XvaAR31Nrap",
        userAddress: "BhBjfxB7NvG4FugPg8d1HCtjRuj5UqDGgsEMxxRo1k3H",
        vestingType: DUMMY_DEAL_DATA.vestingType,
        amount: DUMMY_DEAL_DATA.tokenAmount // Must be in base unit (e.g., 1000 for 1 token if token has 3 decimals)
      });
      console.log('createDealTx:', createDealTx);

      // Step 3: Sign and send the transaction
      const signedTx = await wallet.adapter.signTransaction(createDealTx);

      // Step 4: Send the transaction
      const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);
      console.log('Deal created successfully. Tx:', txHash);
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col py-20">
        <h1 className="text-4xl font-medium">Confirm Deal Offer</h1>
        <div className="mt-3">
          <p>
            Unlock 20% of tokens right after the promotion is live. The
            remaining 80% will vest once your project reaches the agreed market
            cap milestones
          </p>
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
        <div className="mt-4 py-5 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Offer Amount</p>
                <p className="font-medium">20 SOL</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Payment Terms</p>
                <p className="font-medium">Market Cap Vesting</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Total Payment</p>
                <p className="font-medium">1,000,000 MICHI</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">First Unlock</p>
                <p className="font-medium">200,000 MICHI</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Second Unlock</p>
                <p className="font-medium">800,000 MICHI</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">
                  Second Unlock to Trigger
                </p>
                <p className="font-medium">$MICHI reached $200M Marketcap</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Marketing Channel</p>
                <p className="font-medium">Twitter Post</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Schedule</p>
                <p className="font-medium">15 October 2024 : 18:00 UTC</p>
              </div>
            </div>
            <p className="font-medium mt-8">Promotional post text</p>
            <p className="mt-4">
              🚀 $Michi is ready to take over the crypto space!🔥 Join the
              $Michi revolution and be part of the most exciting meme coin of
              the year! 📈 Strong community, rapid growth, and big plans ahead!
            </p>
          </div>
        </div>

        <div className="w-full flex justify-end mt-8">
          <IconicButton
            className={"rounded-full border-orangy"}
            arrowBoxClassName={"rounded-full bg-orangy"}
            onClick={handleCreateOffer}
            isLoading={isLoading}
          >
            <p className="group-hover:text-white transition-colors text-orangy pl-3 pr-4">
              Send Offer
            </p>
          </IconicButton>
        </div>
      </div>
    </div>
  );
}

function MarketCapVestingForm({ setStep }) {
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
            <p>Market Cap Milestone</p>
            <div className="w-full flex flex-wrap gap-1">
              {[500000, 1000000, 5000000, 10000000, 200000].map(
                (marketCap, idx) => (
                  <Button
                    key={idx}
                    className="bg-white rounded-xl border p-2 h-14 flex items-center gap-2 flex-1 justify-center"
                  >
                    <p>${marketCap.toLocaleString("en-US")}</p>
                  </Button>
                )
              )}
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
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
