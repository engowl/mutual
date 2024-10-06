import { useNavigate } from "react-router-dom";
import IconicButton from "../../components/ui/IconicButton.jsx";

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-5 justify-center  min-h-screen w-full px-5">
      <img
        src="/assets/mutual_text_logo.svg"
        alt="mutaal_logo"
        className="w-20"
      />

      <h1 className="font-semibold text-3xl text-center">
        Welcome to the Admin Dashboard
      </h1>
      <p>Review and manage project requests</p>

      <IconicButton
        className={"rounded-full border-orangy"}
        arrowBoxClassName={"rounded-full bg-orangy"}
        onClick={() => navigate("/__admin/projects")}
      >
        <p className="group-hover:text-white transition-colors text-orangy pl-3 pr-4">
          See Projects
        </p>
      </IconicButton>
    </div>
  );
}
