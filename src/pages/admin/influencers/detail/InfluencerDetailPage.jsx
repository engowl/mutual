import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mutualPublicAPI } from "../../../../api/mutual.js";
import RandomAvatar from "../../../../components/ui/RandomAvatar.jsx";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import twitterSvg from "../../../../assets/twitter.svg";
import telegramSvg from "../../../../assets/admin/ic-telegram.svg";

export default function InfluencerDetailPage() {
  const params = useParams();
  const { id } = params;

  const [influencer, setInfluencer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInfluencer = useCallback(
    async ({ withLoading = true } = {}) => {
      try {
        if (withLoading) {
          setIsLoading(true);
        }
        const response = await mutualPublicAPI.get(
          `/__admin/influencers/${id}`
        );
        setInfluencer(response.data.data.influencer);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchInfluencer({
      withLoading: true,
    });

    const interval = setInterval(() => {
      fetchInfluencer({
        withLoading: false,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchInfluencer]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  if (!isLoading && influencer) {
    return (
      <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5 py-20">
        <div className="w-full max-w-3xl flex flex-col">
          <div className="size-24 rounded-full bg-neutral-200 overflow-hidden">
            {influencer.twitterAccount.profileImageUrl ? (
              <img
                src={influencer.twitterAccount.profileImageUrl}
                alt="profile"
                className="w-full h-full"
              />
            ) : (
              <RandomAvatar seed={influencer.id} className="w-full h-full" />
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

          <div className="w-full flex flex-col gap-4 md:flex-row md:items-center justify-between mt-8">
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

            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://x.com/${influencer?.twitterAccount?.username}`
                    )
                  }
                  className="size-5"
                >
                  <img src={twitterSvg} alt="ic" className="h-full w-full" />
                </button>
                <button
                  onClick={() => window.open(influencer?.telegramLink)}
                  className="size-5"
                >
                  <img src={telegramSvg} alt="ic" className="h-full w-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-8">
            {influencer.twitterAccount.description === ""
              ? "-"
              : influencer.twitterAccount.description}
          </p>

          <div className="mt-12 flex w-full flex-col md:flex-row gap-6">
            {influencer.packages.length > 0 &&
              influencer.packages.map((pkg) => {
                return (
                  <div
                    key={pkg.id}
                    className="relative bg-white rounded-2xl border p-6 flex-1"
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
                  </div>
                );
              })}
          </div>

          <div className="w-full h-[1px] bg-[#C9C9C9] my-6"></div>
          <DeleteConfirmationModal influencer={influencer} />
        </div>
      </div>
    );
  }
}

function DeleteConfirmationModal({ influencer }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const remove = async () => {
    setLoading(true);

    try {
      await mutualPublicAPI.delete(`/__admin/influencers/${influencer.id}`);
      toast.success(
        `${influencer.twitterAccount.username} has been successfully removed from the platform`
      );
      onClose();
      navigate("/__admin/influencers");
    } catch (error) {
      console.error("FAILED_REMOVE_INFLUENCER: ", error);
      toast.error("Something Wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={onOpen}
        className="text-xs bg-[#E5E5E5] text-[#E63131] rounded-full font-medium h-8 px-6 w-12 "
      >
        Remove
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
                <p className="text-xl font-medium">
                  ⚠️ Are you sure you want to remove this influencer?
                </p>
              </ModalHeader>
              <ModalBody className="w-full">
                <p className="text-[#575757]">
                  Removing{" "}
                  <span className="font-medium text-[#161616]">
                    ${influencer?.twitterAccount?.username}
                  </span>{" "}
                  will permanently delete their profile and all associated data
                  from the platform. This action cannot be undone. Are you sure
                  you want to proceed?
                </p>
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
                  onPress={remove}
                >
                  Remove
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
