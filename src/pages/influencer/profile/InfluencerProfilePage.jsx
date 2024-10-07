import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import RandomAvatar from "../../../components/ui/RandomAvatar.jsx";
import { useMCAuth } from "../../../lib/mconnect/hooks/useMCAuth.jsx";
import EditSvg from "../../../assets/influencer/profile/edit.svg";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { mutualAPI } from "../../../api/mutual.js";
import AsciiFlame from "../../../lib/mconnect/components/AsciiFlame.jsx";

export default function InfluencerProfilePage() {
  const { user, getUser } = useMCAuth();

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      {/* <div className="fixed bottom-0 w-full h-[20vh]">
        <AsciiFlame />
      </div> */}

      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="size-24 rounded-full bg-neutral-200 overflow-hidden">
          {user.influencer.twitterAccount.profileImageUrl ? (
            <img
              src={user.influencer.twitterAccount.profileImageUrl}
              alt="profile"
              className="w-full h-full"
            />
          ) : (
            <RandomAvatar
              seed={user.influencer.twitterAccount.username ?? "1"}
              className="w-full h-full"
            />
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl lg:text-[2.5rem] leading-tight">
            {user.influencer.twitterAccount.name}
          </p>
          <p className="font-medium text-neutral-600">
            @{user.influencer.twitterAccount.username}
          </p>
        </div>
        <div className="w-full flex flex-col items-start gap-4 xl:flex-row xl:items-center justify-between mt-8">
          {/* Account stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="font-medium">
                {user.influencer.twitterAccount.followersCount}
              </p>
              <p className="text-sm">Twitter Followers</p>
            </div>
            <div>
              <p className="font-medium">0%</p>
              <p className="text-sm">Success</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-8">
          {user.influencer.twitterAccount.description === ""
            ? "-"
            : user.influencer.twitterAccount.description}
        </p>

        <div className="mt-12 flex w-full flex-col md:flex-row gap-6">
          {user.influencer.packages.map((pkg) => {
            return (
              <div
                key={pkg.id}
                className="relative bg-white rounded-2xl border p-6 flex-1"
              >
                <EditPackageModal pkg={pkg} getUser={getUser} />
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
      </div>
    </div>
  );
}

function EditPackageModal({ pkg, getUser }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [price, setPrice] = useState(pkg.price);
  const [description, setDesctription] = useState(pkg.description);

  const [isLoading, setIsLoading] = useState(false);

  const handleEditPackage = async () => {
    setIsLoading(true);
    try {
      await mutualAPI.post(`/influencer/package/${pkg.id}/update`, {
        price: parseFloat(price),
        description: description,
      });
      await getUser({ silentLoad: true });
      onClose();
    } catch (error) {
      console.error("FAILED_UPDATE_PACKAGE: ", error);
      toast.error("Something Wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={onOpen} className="absolute top-3 right-3">
        <img src={EditSvg} alt="icon" className="size-6" />
      </button>
      <Modal size={"lg"} isOpen={isOpen} onClose={onClose} hideCloseButton>
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
                  {pkg.type === "TWITTER"
                    ? "Twitter Post"
                    : "Telegram Group Post"}
                </p>
              </ModalHeader>
              <ModalBody className="w-full">
                <div className="flex flex-col">
                  <div className="w-full flex items-center justify-between mt-4">
                    <input
                      value={price}
                      type="number"
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={isLoading}
                      className="text-4xl font-medium outline-none placeholder:text-neutral-300 max-w-64 text-orangy"
                      placeholder="0.00"
                    />
                    <p className="text-3xl font-medium">SOL</p>
                  </div>
                  <div className="mt-6">
                    <p>Description</p>
                    <Textarea
                      value={description}
                      onChange={(e) => setDesctription(e.target.value)}
                      disabled={isLoading}
                      placeholder="Enter your description"
                      variant="bordered"
                      className="mt-2"
                      classNames={{
                        inputWrapper:
                          "bg-creamy-50 border-black/10 border p-4 rounded-lg",
                        input: "placeholder:text-neutral-400",
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  className="rounded-full font-medium"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orangy text-white rounded-full font-medium"
                  onPress={handleEditPackage}
                  isLoading={isLoading}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
