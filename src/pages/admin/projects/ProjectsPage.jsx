import { Button, Spinner } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { mutualPublicAPI } from "../../../api/mutual.js";

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
  const [status, setStatus] = useState("new");
  const [projectOwners, setProjectOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async ({ status, withLoading = true }) => {
    try {
      if (withLoading) {
        setLoading(true);
      }
      const response = await mutualPublicAPI.get(
        `/__admin/projects?status=${status === "new" ? "PENDING" : "APPROVED"}`
      );
      setProjectOwners(response.data.data.projectOwners);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects({ status });

    const interval = setInterval(() => {
      fetchProjects({
        status,
        withLoading: false,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="w-full flex flex-col mt-4 font-medium">
      {/* tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setStatus("new")}
          className={`py-2 flex justify-center rounded-lg ${
            status === "new" ? "text-black" : "text-neutral-500"
          }`}
        >
          New
        </button>
        <button
          onClick={() => setStatus("past")}
          className={`py-2 rounded-lg ml-8 ${
            status === "past" ? "text-black" : "text-neutral-500"
          }`}
        >
          Past
        </button>
      </div>
      <div className="w-full mt-1 bg-white rounded-2xl border p-4 h-[447px] overflow-y-auto">
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-full">
            <Spinner size="xl" color="primary" />
          </div>
        ) : projectOwners.length > 0 ? (
          projectOwners.map((owner) => {
            return (
              <ProjecCard
                key={owner.id}
                owner={owner}
                setStatus={setStatus}
                fetchProjects={fetchProjects}
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

function ProjecCard({ owner, setStatus, fetchProjects }) {
  const [approvalLoading, setApprovalLoading] = useState(false);

  const approve = async () => {
    setApprovalLoading(true);

    try {
      await mutualPublicAPI.post(`/__admin/projects/${owner.id}/approve`);
      setStatus("new");
      fetchProjects({
        status: "new",
        withLoading: false,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 justify-between">
      <div>
        <div className="flex items-center">
          <p className="font-medium">{owner.projectDetails[0].projectName}</p>

          {owner.status === "PENDING" ? (
            <span className="ml-3 px-2 py-1 rounded-full bg-[#E0EBFF] border border-[#C8DAFA] text-[#0A809D] text-xs">
              New Registration
            </span>
          ) : (
            <span className="ml-3 px-2 py-1 rounded-full bg-orangy/10 border border-orangy text-orangy text-xs">
              Confirmed
            </span>
          )}
        </div>

        {/* Detail offers */}
        {/* <div className="flex items-center gap-4 text-sm mt-4 text-neutral-500">
          <div>
            <p>Direct Payment</p>
          </div>
          <div>
            <p>10 SOL</p>
          </div>
          <div>
            <p>Twitter Post</p>
          </div>
        </div> */}
      </div>
      {/* action buttons */}
      {owner.status === "PENDING" && (
        <Button
          onClick={approve}
          isLoading={approvalLoading}
          className="text-xs bg-orangy text-white rounded-full font-medium px-6"
        >
          Approve
        </Button>
      )}
    </div>
  );
}
