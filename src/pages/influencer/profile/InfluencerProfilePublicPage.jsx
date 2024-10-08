import {
  Button,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  TimeInput,
  useDisclosure,
} from "@nextui-org/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mutualAPI } from "../../../api/mutual.js";
import RandomAvatar from "../../../components/ui/RandomAvatar.jsx";
import { CHAINS, DIRECT_PAYMENT_TOKEN } from "../../../config.js";
import MutualEscrowSDK from "../../../lib/escrow-contract/MutualEscrowSDK.js";
import { getAlphanumericId } from "../../../utils/misc.js";
import { parseDate, parseTime } from "@internationalized/date";
import toast from "react-hot-toast";
import useMCWallet from "../../../lib/mconnect/hooks/useMCWallet.jsx";
import { useMCAuth } from "../../../lib/mconnect/hooks/useMCAuth.jsx";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function InfluencerProfilePublicPage() {
  const params = useParams();
  const { id } = params;

  const [influencer, setInfluencer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchInfluencer() {
      setIsLoading(true);
      try {
        const res = await mutualAPI.get(`/influencer/${id}`);

        setInfluencer(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInfluencer();
  }, [id]);

  console.log({ influencer });

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  if (!isLoading && influencer) {
    return (
      <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
        <div className="w-full max-w-3xl flex flex-col py-20">
          <div className="size-24 rounded-full bg-neutral-200 overflow-hidden">
            {influencer.twitterAccount.profileImageUrl ? (
              <img
                src={influencer.twitterAccount.profileImageUrl}
                alt="profile"
                className="w-full h-full"
              />
            ) : (
              <RandomAvatar
                seed={influencer.twitterAccount.username ?? "1"}
                className="w-full h-full"
              />
            )}
          </div>
          <div className="mt-4">
            <p className="text-3xl lg:text-[2.5rem] leading-tight">
              {influencer.twitterAccount.name}
            </p>
            <p className="font-medium text-neutral-600">
              @{influencer.twitterAccount.username}
            </p>
          </div>
          <div className="w-full flex flex-col gap-4 xl:flex-row xl:items-center justify-between mt-8">
            {/* Account stats */}
            <div className="flex items-center gap-8">
              <div>
                <p className="font-medium">
                  {influencer.twitterAccount.followersCount}
                </p>
                <p className="text-sm">Followers</p>
              </div>
              <div>
                <p className="font-medium">0%</p>
                <p className="text-sm">Success</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-8">
            {influencer.twitterAccount.description === ""
              ? "-"
              : influencer.twitterAccount.description}
          </p>

          <div className="mt-12 flex flex-col md:flex-row w-full gap-6">
            {influencer.packages.map((pkg) => {
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border p-6 flex-1"
                >
                  <p className="font-medium">
                    {pkg.type === "TWITTER"
                      ? "Tweet Post"
                      : "Telegram Group Post"}
                  </p>
                  <p className="text-neutral-500 mt-1 text-sm">
                    {pkg.description}
                  </p>
                  <div className="flex items-baseline gap-2 mt-7">
                    <p className="text-4xl font-medium">{pkg.price}</p>
                    <div className="flex flex-row items-center gap-1">
                      <img
                        src={DIRECT_PAYMENT_TOKEN.imageUrl}
                        alt="ic"
                        className="w-6 h-6 rounded-full"
                      />
                      <p className="text-xl font-medium">
                        {DIRECT_PAYMENT_TOKEN.symbol}
                      </p>
                    </div>
                  </div>

                  {pkg.type === "TWITTER" ? (
                    <TweetPackageModal
                      solTotal={
                        influencer.packages.find(
                          (pkg) => pkg.type === "TWITTER"
                        )?.price || 0
                      }
                      influencer={influencer}
                    />
                  ) : (
                    <TelegramPackageModal
                      solTotal={
                        influencer.packages.find(
                          (pkg) => pkg.type === "TELEGRAM_GROUP"
                        )?.price || 0
                      }
                      influencer={influencer}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

function TelegramPackageModal({ solTotal, influencer }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sessionKey, _] = useLocalStorage("session_key", null);

  const [isLoading, setIsLoading] = useState(false);

  const { signSolanaTxWithPortal, address: mpcAddress } = useMCWallet();
  const { walletType } = useMCAuth();

  const { wallet } = useWallet();

  const handleTelegramSubmit = async (formData) => {
    try {
      setIsLoading(true);
      const chain = CHAINS.find((chain) => chain.id === "devnet");

      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: sessionKey,
        chainId: "devnet",
        chains: CHAINS,
      });

      const DATA = {
        orderId: getAlphanumericId(16),
        influencerId: influencer.id,
        vestingType: "NONE",
        vestingCondition: {},
        mintAddress: chain.directPaymentToken.mintAddress,
        tokenAmount: parseFloat(solTotal),
        campaignChannel: "TELEGRAM",
        promotionalPostText: formData.promotionalText,
        postDateAndTime: new Date(formData.postDateAndTime).toISOString(),
      };

      await escrowSDK.verifyOffer(DATA);
      console.log("Offer verified successfully");

      const createDealTx = await escrowSDK.prepareCreateDealTransaction({
        orderId: DATA.orderId,
        mintAddress: chain.directPaymentToken.mintAddress,
        kolAddress: influencer.user.wallet.address,
        userAddress:
          walletType === "MPC"
            ? mpcAddress
            : wallet.adapter.publicKey.toBase58(),
        vestingType: "NONE",
        amount: DATA.tokenAmount * 10 ** chain.directPaymentToken.decimals,
      });
      console.log("Create deal transaction prepared:", createDealTx);

      let signedTx;

      if (walletType === "MPC") {
        signedTx = await signSolanaTxWithPortal(createDealTx);
      } else {
        signedTx = await wallet.adapter.signTransaction(createDealTx);
      }

      const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);

      console.log("Deal created successfully. Tx:", txHash);

      const created = await escrowSDK.createOffer({
        dealData: DATA,
        txHash: txHash,
      });

      console.log("Offer created successfully:", created);

      toast.success("Offer sent successfully");
    } catch (error) {
      console.error(
        "Error submitting Twitter Package:",
        error?.response?.data?.message || error
      );
      toast.error("Error submitting Twitter Package");
    } finally {
      setIsLoading(false);
      onClose(); // Close modal after submission
    }
  };

  return (
    <PackageModal
      title="Telegram Post Package"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      total={solTotal}
      isLoading={isLoading}
      onSubmit={handleTelegramSubmit}
      isComingSoon={true}
    />
  );
}

function TweetPackageModal({ solTotal, influencer }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [sessionKey, _] = useLocalStorage("session_key", null);
  const [isLoading, setIsLoading] = useState(false);

  const { signSolanaTxWithPortal, address: mpcAddress } = useMCWallet();
  const { walletType } = useMCAuth();

  const { wallet } = useWallet();

  const handleTweetSubmit = async (formData) => {
    try {
      // Submit logic for Twitter Package
      setIsLoading(true);
      console.log("Submitting Twitter Package:", formData);
      const chain = CHAINS.find((chain) => chain.id === "devnet");

      const escrowSDK = new MutualEscrowSDK({
        backendEndpoint: import.meta.env.VITE_BACKEND_URL,
        bearerToken: sessionKey,
        chainId: "devnet",
        chains: CHAINS,
      });

      const DATA = {
        orderId: getAlphanumericId(16),
        influencerId: influencer.id,
        vestingType: "NONE",
        vestingCondition: {},
        mintAddress: chain.directPaymentToken.mintAddress,
        tokenAmount: parseFloat(solTotal),
        campaignChannel: "TWITTER",
        promotionalPostText: formData.promotionalText,
        postDateAndTime: new Date(formData.postDateAndTime).toISOString(),
      };

      await escrowSDK.verifyOffer(DATA);
      console.log("Offer verified successfully");

      const createDealTx = await escrowSDK.prepareCreateDealTransaction({
        orderId: DATA.orderId,
        mintAddress: chain.directPaymentToken.mintAddress,
        kolAddress: influencer.user.wallet.address,
        userAddress:
          walletType === "MPC"
            ? mpcAddress
            : wallet.adapter.publicKey.toBase58(),
        vestingType: "NONE",
        amount: DATA.tokenAmount * 10 ** chain.directPaymentToken.decimals,
      });
      console.log("Create deal transaction prepared:", createDealTx);

      let signedTx;

      if (walletType === "MPC") {
        signedTx = await signSolanaTxWithPortal(createDealTx);
      } else {
        // Sign with EOA wallet
        signedTx = await wallet.adapter.signTransaction(createDealTx);
      }

      const txHash = await escrowSDK.sendAndConfirmTransaction(signedTx);

      console.log("Deal created successfully. Tx:", txHash);

      const created = await escrowSDK.createOffer({
        dealData: DATA,
        txHash: txHash,
      });

      console.log("Offer created successfully:", created);

      toast.success("Offer sent successfully");
      navigate(`/project-owner/offers/${created.id}`);
    } catch (error) {
      console.error(
        "Error submitting Twitter Package:",
        error?.response?.data?.message || error
      );
      toast.error("Error submitting Twitter Package");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <PackageModal
      title="Tweet Post Package"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      total={solTotal}
      isLoading={isLoading}
      onSubmit={handleTweetSubmit} // Submit handler passed as a prop
    />
  );
}

function PackageModal({
  title,
  onClose,
  isOpen,
  onOpen,
  total,
  onSubmit,
  isLoading,
  isComingSoon = false,
}) {
  const [formData, setFormData] = useState({
    campaignTitle: "",
    promotionalText: "",
    notes: "",
    postDateAndTime: null,
  });

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentDay = String(currentDate.getDate()).padStart(2, "0");

  const [selectedDate, setSelectedDate] = useState(
    parseDate(`${currentYear}-${currentMonth}-${currentDay}`)
  );
  const [selectedTime, setSelectedTime] = useState(parseTime("12:00:00"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleOpen = () => {
    onOpen();
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleDateInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const combineDateAndTime = (dateISO, timeObject) => {
    if (!dateISO || !timeObject) return null;

    const date = new Date(dateISO);

    date.setHours(timeObject.hour);
    date.setMinutes(timeObject.minute);
    date.setSeconds(timeObject.second);
    date.setMilliseconds(timeObject.millisecond || 0); // Set milliseconds, default to 0 if not provided

    return date;
  };

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const combinedDateTime = combineDateAndTime(selectedDate, selectedTime);
      handleDateInputChange("postDateAndTime", combinedDateTime);
    }
  }, [selectedDate, selectedTime]);

  return (
    <>
      <Button
        onClick={handleOpen}
        className="w-full h-10 bg-orangy text-white rounded-full mt-8"
        isDisabled={isComingSoon}
      >
        {isComingSoon ? "Coming Soon" : "Send Offer"}
      </Button>
      <Modal size={"xl"} isOpen={isOpen} onClose={onClose} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <button
                onClick={onClose}
                className="size-8 rounded-full absolute top-4 right-4 flex items-center justify-center"
              >
                <X className="size-5 text-neutral-400 stroke-2 hover:text-neutral-600" />
              </button>
              <ModalHeader>
                <p className="text-xl font-medium">{title}</p>
              </ModalHeader>
              <ModalBody className="w-full">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="campaignTitle"
                    className="text-sm text-neutral-500"
                  >
                    Campaign Title
                  </label>
                  <Input
                    name="campaignTitle"
                    value={formData.campaignTitle}
                    onChange={handleChange}
                    placeholder="Enter Campaign Title"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "h-12 rounded-lg border shadow-none",
                      input: "placeholder:text-neutral-300",
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="promotionalText"
                    className="text-sm text-neutral-500"
                  >
                    Promotional Post Text
                  </label>
                  <Textarea
                    name="promotionalText"
                    value={formData.promotionalText}
                    onChange={handleChange}
                    placeholder="Enter Promotional Post Text"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "h-12 rounded-lg border shadow-none",
                      input: "placeholder:text-neutral-300",
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="notes" className="text-sm text-neutral-500">
                    Notes
                  </label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter Notes"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "h-12 rounded-lg border shadow-none",
                      input: "placeholder:text-neutral-300",
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-neutral-500">Post Date and Time</p>
                  <div className="w-full flex gap-2">
                    <DatePicker
                      variant="bordered"
                      className="flex-1"
                      aria-labelledby="date-input"
                      aria-label="date-input"
                      value={selectedDate}
                      onChange={setSelectedDate}
                      dateInputClassNames={{
                        inputWrapper: "h-12 rounded-lg border shadow-none",
                      }}
                    />
                    <TimeInput
                      className="max-w-32"
                      variant="bordered"
                      aria-labelledby="time-input"
                      aria-label="time-input"
                      value={selectedTime}
                      onChange={setSelectedTime}
                      classNames={{
                        inputWrapper: "h-12 rounded-lg border shadow-none",
                      }}
                    />
                  </div>
                </div>
                <div className="bg-creamy-300 px-4 py-3 mt-4 w-full flex items-center justify-between text-xl font-medium rounded-xl">
                  <p>Total</p>
                  <p>
                    {total} {DIRECT_PAYMENT_TOKEN.symbol}
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  className="rounded-full font-medium"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  isLoading={isLoading}
                  className="bg-orangy text-white rounded-full font-medium"
                  onPress={handleSubmit}
                >
                  Send Offer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
