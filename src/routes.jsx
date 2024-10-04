import { createBrowserRouter } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import RootLayout from "./layouts/RootLayout";
import ProfilePage from "./pages/ProfilePage";
import InfluencerRegisterPage from "./pages/register/InfluencerRegisterPage";
import ProjectOwnerRegisterPage from "./pages/register/ProjectOwnerRegisterPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <IndexPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/register",
        children: [
          {
            path: "influencer",
            element: <InfluencerRegisterPage />,
          },
          {
            path: "project-owner",
            element: <ProjectOwnerRegisterPage />,
          },
        ],
      },
    ],
  },
]);
