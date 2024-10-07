import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { mutualAPI } from "../../../api/mutual";
import { cnm } from "../../../utils/style";
import { AxiosError } from "axios";

export default function SubmitProofModal({ orderId, className }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSuccess, setIsSuccess] = useState(false);
  const [twitterLink, setTwitterLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmitProof() {
    if (isLoading) return;
    if (!twitterLink) {
      toast.error("Please enter a valid Twitter link");
      return;
    }

    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }
    // Submit proof logic here
    setIsLoading(true);
    try {
      const res = await mutualAPI.post("/campaign/submit-work", {
        orderId,
        twitterPostLink: twitterLink,
      });
      console.log("Proof submitted:", res.data);
      toast.success("Proof submitted successfully");
      setIsSuccess(true);
    } catch (e) {
      if (e instanceof AxiosError) {
        return toast.error(
          e.response?.data?.message || "Error submitting proof"
        );
      }
      console.error("Error submitting proof:", e);
      toast.error("Error submitting proof");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={cnm(
          "bg-orangy text-white rounded-full font-medium lg:px-8 text-xs md:text-base",
          className
        )}
      >
        Submit Proof
      </Button>
      <Modal size={"lg"} isOpen={isOpen} onClose={onClose} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <button
                onClick={onClose}
                className="size-10 rounded-full absolute top-3 right-3 flex items-center justify-center"
              >
                <X className="size-5 text-neutral-400 stroke-2 hover:text-neutral-600" />
              </button>
              {isSuccess ? (
                <ModalBody>
                  <div className="flex flex-col items-start justify-center gap-3 px-2 py-4">
                    <p className="text-2xl font-medium text-center">
                      Thank You for Your Submission! 🎉
                    </p>
                    <p className="text-start text-neutral-500">
                      We will verify that your tweet remains live for the next 6
                      hours. Once the verification is complete, you can claim
                      your fee on our Offer page.
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                      }}
                      className="bg-orangy text-white rounded-full font-medium text-sm w-20 md:w-24 ml-auto mt-1"
                    >
                      Close
                    </Button>
                  </div>
                </ModalBody>
              ) : (
                <>
                  <ModalHeader>
                    <p className="text-xl font-medium px-2 pt-2">
                      Submit Proof
                    </p>
                  </ModalHeader>
                  <ModalBody className="flex flex-col gap-2 px-8 pb-8">
                    <p className="text-sm text-neutral-700">Twitter Link</p>
                    <div className="flex flex-col gap-4">
                      <Input
                        placeholder="Enter your social media post URL"
                        variant="bordered"
                        onChange={(e) => setTwitterLink(e.target.value)}
                        classNames={{
                          inputWrapper:
                            "rounded-lg border p-4 shadow-none h-12",
                        }}
                      />
                    </div>
                    <div className="w-full flex items-center justify-end gap-2 mt-2">
                      <Button
                        onClick={onClose}
                        className="rounded-full h-9"
                        color="default"
                      >
                        Back
                      </Button>
                      <Button
                        isLoading={isLoading}
                        onClick={handleSubmitProof}
                        className="bg-orangy h-9 text-white rounded-full font-medium text-sm w-20 md:w-24"
                      >
                        Submit
                      </Button>
                    </div>
                  </ModalBody>
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
