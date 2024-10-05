export default function OfferStatusBadge({ status = "waiting" }) {
  if (status === "accepted") {
    return <div color="success">Accepted</div>;
  } else if (status === "rejected") {
    return <div color="danger">Rejected</div>;
  } else if (status === "pending") {
    return <div color="warning">Pending</div>;
  } else {
    return <div color="secondary">Unknown</div>;
  }
}
