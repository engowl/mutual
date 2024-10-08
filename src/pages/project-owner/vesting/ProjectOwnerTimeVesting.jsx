import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from "../../../utils/string";
import {
  Button,
  DatePicker,
  Input,
  Textarea,
  TimeInput,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import IconicButton from "../../../components/ui/IconicButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCookies } from "react-cookie";
import { atom, useAtom, useAtomValue } from "jotai";
import { getAlphanumericId } from "../../../utils/misc";
import { CHAINS, OFFER_CONFIG } from "../../../config";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK";
import { useMCAuth } from "../../../lib/mconnect/hooks/useMCAuth";
import useSWR from "swr";
import { mutualAPI } from "../../../api/mutual";
import { cnm } from "../../../utils/style";
import { parseDate, parseTime } from "@internationalized/date";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { BN } from "bn.js";
import useMCWallet from "../../../lib/mconnect/hooks/useMCWallet.jsx";
import bs58 from "bs58";
import { Transaction } from "@solana/web3.js";
import { useLocalStorage } from "@uidotdev/usehooks";

dayjs.extend(utc);

const vestingPeriods = [
  {
    label: "1 Month",
    value: "1-month",
    seconds: 30 * 24 * 60 * 60, // 1 month in seconds
  },
  {
    label: "2 Months",
    value: "2-months",
    seconds: 2 * 30 * 24 * 60 * 60, // 2 months in seconds
  },
  {
    label: "3 Months",
    value: "3-months",
    seconds: 3 * 30 * 24 * 60 * 60, // 3 months in seconds
  },
  {
    label: "6 Months",
    value: "6-months",
    seconds: 6 * 30 * 24 * 60 * 60, // 6 months in seconds
  },
  {
    label: "1 Year",
    value: "1-year",
    seconds: 365 * 24 * 60 * 60, // 1 year in seconds
  },
];

const timeVestingFormAtom = atom({
  key: "timeVestingFormAtom",
  tokenOfferAmount: "",
  percentageOfSupply: "",
  timeMilestone: "",
  timeMilestoneValue: "",
  telegramAdminUsername: "",
  marketingChannel: "",
  promotionalPostText: "",
  postDateAndTime: "",
});

export default function ProjectOwnerTimeVestingPage() {
  const [step, setStep] = useState(1);
  switch (step) {
    case 1:
      return <TimeVestingForm setStep={setStep} />;
    case 2:
      return <TimeVestingConfirmation setStep={setStep} />;
  }
}

function TimeVestingConfirmation({ setStep }) {
  const { wallet } = useWallet();
  const [sessionKey, _] = useLocalStorage("session_key", null);

  const params = useParams();
  const influencerId = params.influencerId;
  const navigate = useNavigate();

  const { signSolanaTxWithPortal, address: mpcAddress } = useMCWallet();
  const { walletType } = useMCAuth();

  const { data: influencerData } = useSWR(
    `/influencer/${influencerId}`,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const formData = useAtomValue(timeVestingFormAtom);

  const { user } = useMCAuth();
  // TODO change network to dynamic
  const { data } = useSWR(
    user
      ? `/wallet/info?walletAddress=${user.wallet.address}&network=devnet`
      : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      console.log({ data });
      return data.data;
    }
  );

  const tokenInfo =
    data && user
      ? data.find(
          (d) => d.mint === user.projectOwner.projectDetails[0].contractAddress
        )
      : null;

  console.log("formData:", formData);

  const [isLoading, setIsLoading] = useState(false);
  const handleCreateOffer = async () => {
    if (isLoading) return;
    // TODO complete validation and data
    try {
      setIsLoading(true);

      console.log("formData:", formData);

      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: sessionKey,
        chainId: "devnet",
        chains: CHAINS,
      });

      const DATA = {
        orderId: getAlphanumericId(16), // Random orderId, must be 16 characters alphanumeric
        influencerId: influencerId,
        vestingType: "TIME",
        vestingCondition: {
          vestingDuration: formData.timeMilestoneValue,
        },
        chainId: "devnet",
        mintAddress: "6EXeGq2NuPUyB9UFWhbs35DBieQjhLrSfY2FU3o9gtr7",
        tokenAmount: parseFloat(formData.tokenOfferAmount),
        campaignChannel: formData.marketingChannel,
        promotionalPostText: formData.promotionalPostText,
        postDateAndTime: new Date(formData.postDateAndTime),
      };

      console.log("DATA:", DATA);

      // return;

      // Step 1: Verify the offer
      await escrowSDK.verifyOffer(DATA);
      console.log("Offer is valid!");

      // Step 2: Prepare the transaction to create the deal
      const createDealTx = await escrowSDK.prepareCreateDealTransaction({
        orderId: DATA.orderId,
        mintAddress: DATA.mintAddress,
        kolAddress: influencerData.data.user.wallet.address,
        userAddress:
          walletType === "MPC"
            ? mpcAddress
            : wallet.adapter.publicKey.toBase58(),
        vestingType: DATA.vestingType,
        amount: new BN(DATA.tokenAmount).mul(
          new BN(10).pow(new BN(tokenInfo?.decimals))
        ),
      });
      console.log("createDealTx:", createDealTx);

      let signedTx;

      // Step 3: Sign and send the transaction
      if (walletType === "MPC") {
        // Step 3: Sign with MPC
        const serializedTransaction = createDealTx.serialize({
          requireAllSignatures: false,
        });

        // Convert the serialized Buffer to a Base64 string
        const base64Transaction = serializedTransaction.toString("base64");

        const signature = await signSolanaTxWithPortal({
          messageToSign: base64Transaction,
        });

        console.log("Success sign using portal: ", signature);

        const transactionBuffer = bs58.decode(signature);
        signedTx = Transaction.from(transactionBuffer);
      } else {
        signedTx = await wallet.adapter.signTransaction(createDealTx);
      }

      // Step 4: Send the transaction
      const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);
      console.log("Deal created successfully. Tx:", txHash);

      const created = await escrowSDK.createOffer({
        dealData: DATA,
        txHash: txHash,
      });

      console.log("Offer created:", created);
      navigate("/success/offer-submit");
    } catch (error) {
      console.error("Error creating deal:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <p className="text-2xl font-medium">
              {tokenInfo?.name} (${tokenInfo?.symbol})
            </p>
            <div className="font-medium">DexScreener</div>
          </div>
          <div className="flex gap-7 mt-3">
            <div>
              <p className="text-orangy font-medium">$150M</p>
              <p className="text-sm text-neutral-500">Market Cap</p>
            </div>
            <div>
              <p className="text-orangy font-medium">
                {shortenAddress(tokenInfo?.mint)}
              </p>
              <p className="text-sm text-neutral-500">Contract Address</p>
            </div>
            <div>
              <p className="text-orangy font-medium">
                {tokenInfo?.amount.toLocaleString("en-US")}
              </p>
              <p className="text-sm text-neutral-500">Total Supply</p>
            </div>
          </div>
        </div>
        <div className="mt-4 py-5 px-4 rounded-xl bg-white border flex items-center justify-between">
          <div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Total Payment</p>
                <p className="font-medium">{formData.tokenOfferAmount} MICHI</p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Payment Terms</p>
                <p className="font-medium">Time Vesting</p>
              </div>

              <div className="flex items-center">
                <p className="w-48 text-neutral-400">First Unlock</p>
                <p className="font-medium">
                  {(
                    formData.tokenOfferAmount *
                    OFFER_CONFIG.firstUnlockPercentage
                  ).toFixed(3)}{" "}
                  {tokenInfo?.symbol}
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Second Unlock</p>
                <p className="font-medium">
                  {(
                    formData.tokenOfferAmount *
                    OFFER_CONFIG.secondUnlockPercentage
                  ).toFixed(3)}{" "}
                  {tokenInfo?.symbol}
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">
                  Second Unlock to Trigger
                </p>
                <p className="font-medium">
                  ${tokenInfo?.symbol} reached{" "}
                  {
                    vestingPeriods.find(
                      (period) => period.seconds === formData.timeMilestone
                    )?.label
                  }{" "}
                  Vesting Time
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Marketing Channel</p>
                <p className="font-medium">
                  {formData.marketingChannel === "twitter"
                    ? "Twitter"
                    : "Telegram"}{" "}
                  Post
                </p>
              </div>
              <div className="flex items-center">
                <p className="w-48 text-neutral-400">Schedule</p>
                <p className="font-medium">
                  {dayjs(new Date(formData.postDateAndTime))
                    .utc()
                    .format("D MMMM YYYY : HH:mm [UTC]")}
                </p>
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

        <div className="w-full flex justify-end mt-8 gap-4">
          <Button
            size="lg"
            color="default"
            className="rounded-full"
            onClick={() => setStep(1)}
          >
            Back
          </Button>
          <IconicButton
            className={"rounded-full border-orangy"}
            arrowBoxClassName={"rounded-full bg-orangy"}
            isLoading={isLoading}
            onClick={handleCreateOffer}
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

function TimeVestingForm({ setStep }) {
  const [formData, setFormData] = useAtom(timeVestingFormAtom); // Use useAtom here

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentDay = String(currentDate.getDate()).padStart(2, "0");

  const [selectedDate, setSelectedDate] = useState(
    parseDate(`${currentYear}-${currentMonth}-${currentDay}`)
  );
  const [selectedTime, setSelectedTime] = useState(parseTime("12:00:00"));

  const combineDateAndTime = (dateISO, timeObject) => {
    console.log("date:", dateISO);
    console.log("time:", timeObject);

    if (!dateISO || !timeObject) return null;

    const date = new Date(dateISO);

    date.setHours(timeObject.hour);
    date.setMinutes(timeObject.minute);
    date.setSeconds(timeObject.second);
    date.setMilliseconds(timeObject.millisecond || 0); // Set milliseconds, default to 0 if not provided

    return date;
  };

  console.log({ selectedDate, selectedTime });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const combinedDateTime = combineDateAndTime(selectedDate, selectedTime);
      console.log("combinedDateTime:", combinedDateTime);
      handleInputChange("postDateAndTime", combinedDateTime);
    }
  }, [selectedDate, selectedTime]);

  const { user } = useMCAuth();
  // TODO change network to dynamic
  const { data } = useSWR(
    user
      ? `/wallet/info?walletAddress=${user.wallet.address}&network=devnet`
      : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      console.log({ data });
      return data.data;
    }
  );

  const tokenInfo =
    data && user
      ? data.find(
          (d) => d.mint === user.projectOwner.projectDetails[0].contractAddress
        )
      : null;

  console.log({ data, user, tokenInfo });

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
              <p className="text-2xl font-medium">
                {tokenInfo?.name} (${tokenInfo?.symbol} )
              </p>
              <div className="font-medium">DexScreener</div>
            </div>
            <div className="flex gap-7 mt-3">
              <div>
                <p className="text-orangy font-medium">$150M</p>
                <p className="text-sm text-neutral-500">Market Cap</p>
              </div>
              <div>
                <p className="text-orangy font-medium">
                  {shortenAddress(tokenInfo?.mint)}
                </p>
                <p className="text-sm text-neutral-500">Contract Address</p>
              </div>
              <div>
                <p className="text-orangy font-medium">{tokenInfo?.balance}</p>
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
                    value={formData.tokenOfferAmount}
                    onChange={handleChange("tokenOfferAmount")}
                  />
                </div>
                <div className="mt-2 w-full flex items-center justify-between">
                  <p className="text-sm text-neutral-400 px-4 py-2">
                    Balance: {tokenInfo?.amount.toLocaleString("en-US")} $
                    {tokenInfo?.symbol}
                  </p>
                  <div className="p-2">
                    <Button
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          tokenOfferAmount: tokenInfo?.amount.toString(),
                        }));
                      }}
                      className="bg-orangy/10 text-orangy"
                      size="sm"
                    >
                      Max
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="flex-1">
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
            </div> */}
          </div>

          {/* Market cap milestone */}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Vesting Period</p>
            <div className="w-full flex flex-wrap gap-1">
              {vestingPeriods.map((period, idx) => (
                <Button
                  key={idx}
                  className={cnm(
                    "bg-white rounded-xl border py-2 px-4 h-14 flex items-center gap-2 md:flex-1 justify-center",
                    formData.timeMilestone === period.seconds
                      ? "bg-orangy/10 text-orangy border-orangy"
                      : "text-black"
                  )}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      timeMilestone: period.seconds, // Update the timeMilestone in atom state
                      timeMilestoneValue: period.value,
                    }))
                  }
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
                value={formData.telegramAdminUsername}
                onChange={handleChange("telegramAdminUsername")}
              />
            </div>
          </div>

          {/* Marketing Channel */}
          <div className="w-full flex flex-col mt-4 gap-2">
            <p>Marketing Channel</p>
            <div className="w-full flex flex-wrap gap-2">
              <Button
                className={cnm(
                  "flex-1 bg-white h-20 border",
                  formData.marketingChannel === "twitter" &&
                    "bg-orangy/10 border-orangy"
                )}
                variant="bordered"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    marketingChannel: "twitter", // Update marketing channel
                  }))
                }
              >
                X (Twitter) Post
              </Button>
              <Button
                className={cnm(
                  "flex-1 bg-white h-20 border",
                  formData.marketingChannel === "telegram" &&
                    "bg-orangy/10 border-orangy"
                )}
                variant="bordered"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    marketingChannel: "telegram", // Update marketing channel
                  }))
                }
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
                value={formData.promotionalPostText}
                onChange={handleChange("promotionalPostText")}
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
                value={selectedDate}
                onChange={setSelectedDate}
              />
              <TimeInput
                classNames={{
                  inputWrapper: "h-12 bg-white shadow-none border",
                }}
                className="max-w-32"
                variant="bordered"
                value={selectedTime}
                onChange={setSelectedTime}
              />
            </div>
          </div>

          <div className="w-full flex justify-end mt-8">
            <Button
              size="lg"
              onClick={() => setStep(2)}
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
