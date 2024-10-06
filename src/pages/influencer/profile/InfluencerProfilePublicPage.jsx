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
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { mutualAPI } from "../../../api/mutual.js";
import RandomAvatar from "../../../components/ui/RandomAvatar.jsx";

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
            <RandomAvatar
              seed={influencer.twitterAccount.username ?? "1"}
              className="w-full h-full"
            />
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
                    <p className="text-xl font-medium">SOL</p>
                  </div>

                  {pkg.type === "TWITTER" ? (
                    <TweetPackageModal />
                  ) : (
                    <TelegramPackageModal />
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

function TelegramPackageModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleTelegramSubmit = (formData) => {
    // Submit logic for Telegram Package
    console.log("Submitting Telegram Package:", formData);
    onClose(); // Close modal after submission
  };

  return (
    <PackageModal
      title="Telegram Post Package"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      total="2.30 SOL"
      onSubmit={handleTelegramSubmit} // Submit handler passed as a prop
    />
  );
}

function TweetPackageModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleTweetSubmit = (formData) => {
    // Submit logic for Twitter Package
    console.log("Submitting Twitter Package:", formData);
    onClose(); // Close modal after submission
  };

  return (
    <PackageModal
      title="Tweet Post Package"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      total="2.30 SOL"
      onSubmit={handleTweetSubmit} // Submit handler passed as a prop
    />
  );
}

function PackageModal({ title, onClose, isOpen, onOpen, total, onSubmit }) {
  const [formData, setFormData] = useState({
    campaignTitle: "",
    promotionalText: "",
    notes: "",
    postDate: null,
    postTime: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      postDate: date,
    });
  };

  const handleTimeChange = (time) => {
    setFormData({
      ...formData,
      postTime: time,
    });
  };

  const handleOpen = () => {
    onOpen();
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="w-full h-10 bg-orangy text-white rounded-full mt-8"
      >
        Get this package
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
                      selected={formData.postDate}
                      onChange={handleDateChange}
                      dateInputClassNames={{
                        inputWrapper: "h-12 rounded-lg border shadow-none",
                      }}
                    />
                    <TimeInput
                      className="max-w-32"
                      variant="bordered"
                      value={formData.postTime}
                      onChange={handleTimeChange}
                      classNames={{
                        inputWrapper: "h-12 rounded-lg border shadow-none",
                      }}
                    />
                  </div>
                </div>
                <div className="bg-creamy-300 px-4 py-3 mt-4 w-full flex items-center justify-between text-xl font-medium rounded-xl">
                  <p>Total</p>
                  <p>{total}</p>
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
