import { Button } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";

export default function OfferSubmittedSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="w-full min-h-full flex items-center justify-center">
      <div className="w-full max-w-2xl text-center flex flex-col items-center">
        <h1 className="text-[40px] font-medium">
          Your Offer Has Been Submitted! 🎉
        </h1>
        <div className="mt-8 max-w-lg text-start">
          <p>
            Thank you for submitting! Your offer is now in the hands of the
            influencer. Here&apos;s what happens next:
          </p>
          <div className="flex items-baseline gap-4 mt-4">
            <span className="size-1 rounded-full bg-black shrink-0"></span>
            <p>
              Waiting for Approval: The KOL will review your offer and decide
              whether to accept or decline. You’ll be notified as soon as they
              respond.
            </p>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <span className="size-1 rounded-full bg-black shrink-0"></span>
            <p>
              Keep an Eye on Updates: You can track the status of your offer
              from your dashboard. We’ll send you an email and in-app
              notification once the KOL makes their decision.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            navigate("/project-owner/browse");
          }}
          className="bg-orangy rounded-full text-white font-medium mt-10"
          size="lg"
        >
          Go to Browse
        </Button>
      </div>
    </div>
  );
}
