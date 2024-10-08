import { Button, Spinner } from "@nextui-org/react";
import { useCallback, useEffect, useState } from "react";
import { mutualPublicAPI } from "../../../api/mutual.js";
import { useAdmin } from "../hooks/useAdmin.jsx";
import { shortenAddress } from "../../../utils/string.js";
import twitterSvg from "../../../assets/twitter.svg";
import campaignSvg from "../../../assets/admin/ic_round-campaign.svg";
import historySvg from "../../../assets/admin/ic_round-history.svg";
import { cnm } from "../../../utils/style.js";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full px-5">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <h1 className="text-3xl font-medium">Project Account</h1>
        <ProjectsList />
      </div>
    </div>
  );
}

function ProjectsList() {
  const [status, setStatus] = useState("PENDING");
  const [projectOwners, setProjectOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { chain } = useAdmin();

  const fetchProjects = useCallback(
    async ({ status, withLoading = true }) => {
      try {
        if (withLoading) {
          setLoading(true);
        }
        console.log("chain : ", chain);
        if (chain) {
          const response = await mutualPublicAPI.get(
            `/__admin/projects?status=${status}&chainId=${chain.id}`
          );
          setProjectOwners(response.data.data.projectOwners);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [chain]
  );

  useEffect(() => {
    fetchProjects({ status });

    const interval = setInterval(() => {
      fetchProjects({
        status,
        withLoading: false,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchProjects, status]);

  return (
    <div className="w-full flex flex-col mt-4 font-medium">
      {/* tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setStatus("PENDING")}
          className={`py-2 flex justify-center rounded-lg ${
            status === "PENDING" ? "text-black" : "text-neutral-500"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatus("APPROVED")}
          className={`py-2 rounded-lg ml-8 ${
            status === "APPROVED" ? "text-black" : "text-neutral-500"
          }`}
        >
          Registered
        </button>
        <button
          onClick={() => setStatus("DECLINED")}
          className={`py-2 rounded-lg ml-8 ${
            status === "DECLINED" ? "text-black" : "text-neutral-500"
          }`}
        >
          Rejected
        </button>
      </div>
      <div className="w-full mt-1 bg-white rounded-2xl border h-[447px] overflow-y-auto">
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-full">
            <Spinner size="xl" color="primary" />
          </div>
        ) : projectOwners.length > 0 ? (
          projectOwners.map((owner, index) => {
            return (
              <ProjecCard
                key={owner.id}
                owner={owner}
                setStatus={setStatus}
                fetchProjects={fetchProjects}
                isLastIndex={index === projectOwners.length - 1}
              />
            );
          })
        ) : (
          <div className="w-full flex items-center justify-center min-h-full">
            <p>No items to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjecCard({ owner, setStatus, fetchProjects, isLastIndex }) {
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  const confirm = async (status) => {
    setConfirmationLoading(true);

    try {
      await mutualPublicAPI.post(`/__admin/projects/${owner.id}/confirm`, {
        status: status,
      });
      setStatus("PENDING");
      fetchProjects({
        status: "PENDING",
        withLoading: false,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setConfirmationLoading(false);
    }
  };

  return (
    <div
      className={cnm(
        "flex items-center gap-4 py-6 justify-between",
        `${isLastIndex ? "" : "border-b-[1px]"}`
      )}
    >
      <div className="flex flex-col gap-2 w-full pl-6">
        <div className="flex items-center">
          <p className="font-medium">
            {owner.projectDetails[0].projectName} ($
            {owner.projectDetails[0].tokenInfo.symbol})
          </p>
        </div>

        <div className="flex gap-4 text-[#575757]">
          <div className="flex gap-0.5 items-center">
            <div className="size-4">
              <svg
                width="16"
                height="17"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <path
                  d="M12.4069 4.00563C11.6525 2.7125 10.62 2 9.5 2H6.5C5.38 2 4.3475 2.7125 3.59313 4.00563C2.88813 5.21375 2.5 6.8125 2.5 8.5C2.5 10.1875 2.88813 11.7863 3.59313 12.9944C4.3475 14.2875 5.38 15 6.5 15H9.5C10.62 15 11.6525 14.2875 12.4069 12.9944C13.1119 11.7863 13.5 10.1875 13.5 8.5C13.5 6.8125 13.1119 5.21375 12.4069 4.00563ZM12.4869 8H10.4869C10.4478 6.97398 10.2435 5.96097 9.88188 5H11.7937C12.1762 5.83625 12.4288 6.875 12.4869 8ZM11.1994 4H9.40375C9.19497 3.63765 8.94314 3.30188 8.65375 3H9.5C10.125 3 10.7125 3.375 11.1994 4ZM9.5 14H8.65563C8.94502 13.6981 9.19685 13.3623 9.40563 13H11.2013C10.7125 13.625 10.125 14 9.5 14ZM11.7937 12H9.8825C10.2441 11.039 10.4484 10.026 10.4875 9H12.4875C12.4288 10.125 12.1762 11.1637 11.7937 12Z"
                  fill="#000000"
                />
              </svg>
            </div>

            <p className="font-regular text-xs">
              {shortenAddress(owner.projectDetails[0].contractAddress)}
            </p>
          </div>

          <div className="flex gap-0.5 items-center">
            <div className="size-4">
              <img src={twitterSvg} alt="ic" className="h-full w-full" />
            </div>

            <p className="font-regular text-xs">
              {shortenAddress(owner.projectDetails[0].contractAddress)}
            </p>
          </div>
        </div>
      </div>

      {owner.status === "APPROVED" && (
        <div className="flex gap-4 items-center justify-end w-full pr-6">
          <div className="flex gap-2 items-center">
            <div className="rounded-full size-10 flex items-center justify-center aspect-square border-[1px] border-[#D9D9D9] p-2">
              <img src={campaignSvg} alt="ic" className="h-full w-full" />
            </div>

            <div className="flex flex-col">
              <p>{owner.activeCampaigns}</p>
              <p className="text-xs text-[#575757]">Active Campaigns</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-full size-10 flex items-center justify-center aspect-square border-[1px] border-[#D9D9D9] p-2">
              <img src={historySvg} alt="ic" className="h-full w-full" />
            </div>

            <div className="flex flex-col">
              <p>{owner.pastCampaigns}</p>
              <p className="text-xs text-[#575757]">Past Campaigns</p>
            </div>
          </div>
        </div>
      )}

      {/* action buttons */}
      {owner.status === "PENDING" && (
        <div className="flex gap-2 pr-6">
          <Button
            onClick={() => confirm("DECLINED")}
            isLoading={confirmationLoading}
            className="text-xs bg-[#E5E5E5] text-[#161616] rounded-full font-medium h-8 px-6 w-12 "
          >
            Reject
          </Button>
          <Button
            onClick={() => confirm("APPROVED")}
            isLoading={confirmationLoading}
            className="text-xs bg-orangy text-white rounded-full font-medium px-6 h-8 w-12"
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
