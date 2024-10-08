import { useEffect, useState } from "react";
import { mutualPublicAPI } from "../../api/mutual.js";
import { Spinner } from "@nextui-org/react";

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  async function fetchOverview({ withLoading = true }) {
    if (withLoading) {
      setOverviewLoading(true);
    }
    try {
      const res = await mutualPublicAPI.get("/__admin/overview");

      setOverview(res.data.data.overview);
    } catch (error) {
      console.error("FAILED_FETCH_OVERVIEW: ", error);
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview({ withLoading: true });

    const interval = setInterval(() => {
      fetchOverview({
        withLoading: false,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen w-full px-5">
      <div className="w-full max-w-7xl flex flex-col py-20 gap-8">
        <h1 className="text-3xl font-medium">Hi, Admin! 😊</h1>

        {/* Overview */}
        {overviewLoading && !overview ? (
          <div className="w-full flex items-center justify-center h-40">
            <Spinner size="xl" color="primary" />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <OverviewCard
              title={"Number of Influencers"}
              value={overview?.influencers?.count ?? 0}
              percentage={overview?.influencers?.percentageChange ?? 0}
            />
            <OverviewCard
              title={"Number of Projects"}
              value={overview?.projects?.count}
              percentage={overview?.projects?.percentageChange ?? 0}
            />
            <OverviewCard
              title={"Current Active Campaigns"}
              value={overview?.campaigns?.active?.count}
              percentage={overview?.campaigns?.active?.percentageChange ?? 0}
            />
            <OverviewCard
              title={"Number of Completed Campaigns"}
              value={overview?.campaigns?.past?.count}
              percentage={overview?.campaigns?.past?.percentageChange ?? 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ title, value, percentage }) {
  return (
    <div className="col-span-6 md:col-span-4 lg:col-span-3 flex flex-col p-5 bg-[#F7F8FA] rounded-xl border-[1px] border-[#C9C9C9]">
      <h1 className="font-medium mb-3">{title}</h1>

      <p className="text-xl font-medium mt-auto">{value}</p>

      <div className="flex gap-2 items-center mt-2">
        <div
          className={`flex items-center gap-0.5 ${
            percentage >= 0
              ? "bg-[#DCFBE3] border-[#BDEFD4]"
              : "bg-[#FCE5E5] border-[#F8CACA]"
          } rounded-lg py-1 px-2`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={
                percentage >= 0
                  ? "M8 3.3335V12.6668M8 3.3335L12 7.3335M8 3.3335L4 7.3335" // Up arrow for positive percentage
                  : "M8 12.6668V3.3335M8 12.6668L4 8.66683M8 12.6668L12 8.66683" // Down arrow for negative percentage
              }
              stroke={percentage >= 0 ? "#137F2D" : "#D32F2F"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p
            className={`text-xs font-medium ${
              percentage >= 0 ? "text-[#137F2D]" : "text-[#D32F2F]"
            }`}
          >
            {percentage}%
          </p>
        </div>

        <p className="text-xs">vs last month</p>
      </div>
    </div>
  );
}
