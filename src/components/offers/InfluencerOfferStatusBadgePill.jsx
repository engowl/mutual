export default function InfluencerOfferStatusBadgePill({ status }) {
  switch (status) {
    case "CREATED":
      return (
        <span className="px-2 py-1 rounded-lg bg-orangy/10 border border-orangy text-orangy text-xs font-medium">
          Waiting for Approval
        </span>
      );
    case "REJECTED":
      return (
        <span className="px-2 py-1 rounded-lg bg-[#FFD7D7] border border-[#F4BDBD] text-[#7F1313] text-xs font-medium">
          Declined
        </span>
      );
    case "COMPLETED":
      return (
        <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-700 text-green-500 text-xs font-medium">
          Completed
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="px-2 py-1 rounded-lg bg-[#E0EBFF] border border-[#C8DAFA] text-[#0A809D] text-xs font-medium">
          Scheduled
        </span>
      );
    default:
      return null;
  }
}
