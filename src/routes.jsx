import { createBrowserRouter } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import RootLayout from "./layouts/RootLayout";
import InfluencerRegisterPage from "./pages/register/InfluencerRegisterPage";
import ProjectOwnerRegisterPage from "./pages/register/ProjectOwnerRegisterPage";
import InfluencerProfilePage from "./pages/influencer/profile/InfluencerProfilePage";
import InfluencerProfilePublicPage from "./pages/influencer/profile/InfluencerProfilePublicPage";
import InfluencerMessagePage from "./pages/influencer/InfluencerMessagePage";
import InfluencerOffersPage from "./pages/influencer/offers/InfluencerOffersPage";
import InfluencerOffersDetailPage from "./pages/influencer/offers/InfluencerOffersDetailPage";
import ProjectOwnerBrowsePage from "./pages/project-owner/ProjectOwnerBrowsePage";
import ProjectOwnerOffersPage from "./pages/project-owner/offers/ProjectOwnerOffersPage";
import ProjectOwnerMessagePage from "./pages/project-owner/ProjectOwnerMessagePage";
import OfferSubmittedSuccessPage from "./pages/success/OfferSubmittedSuccessPage";
import ProjectOwnerMarketCapVestingPage from "./pages/project-owner/vesting/ProjectOwnerMarketCapVestingPage";
import ProjectOwnerTimeVestingPage from "./pages/project-owner/vesting/ProjectOwnerTimeVesting";
import ProjectOwnerOffersDetailPage from "./pages/project-owner/offers/ProjectOwnerOffersDetailsPage";
import RolesAuthRouteGuard from "./components/guard/RolesAuthRouteGuard";
import ProjectOwnerRegisterRouteGuard from "./components/guard/register/ProjectOwnerRegisterRouteGuard";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import KolPage from "./pages/admin/kol/KolPage.jsx";
import ProjectsPage from "./pages/admin/projects/ProjectsPage.jsx";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <IndexPage />,
      },
      {
        path: "/register",
        children: [
          {
            path: "influencer",
            element: (
              <RolesAuthRouteGuard roles={["INFLUENCER"]}>
                <InfluencerRegisterPage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "project-owner",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerRegisterRouteGuard>
                  <ProjectOwnerRegisterPage />
                </ProjectOwnerRegisterRouteGuard>
              </RolesAuthRouteGuard>
            ),
          },
        ],
      },
      {
        path: "/influencer",
        children: [
          {
            path: "offers",
            element: (
              <RolesAuthRouteGuard roles={["INFLUENCER"]}>
                <InfluencerOffersPage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "offers/:id",
            element: <InfluencerOffersDetailPage />,
          },
          {
            path: "profile",
            element: (
              <RolesAuthRouteGuard roles={["INFLUENCER"]}>
                <InfluencerProfilePage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "profile/:id",
            element: <InfluencerProfilePublicPage />,
          },
          {
            path: "message",
            element: (
              <RolesAuthRouteGuard roles={["INFLUENCER"]}>
                <InfluencerMessagePage />
              </RolesAuthRouteGuard>
            ),
          },
        ],
      },
      {
        path: "/project-owner",
        children: [
          {
            path: "browse",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerBrowsePage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "offers",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerOffersPage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "offers/:id",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerOffersDetailPage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "message",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerMessagePage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "market-cap-vesting/:influencerId",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerMarketCapVestingPage />
              </RolesAuthRouteGuard>
            ),
          },
          {
            path: "time-vesting/:influencerId",
            element: (
              <RolesAuthRouteGuard roles={["PROJECT_OWNER"]}>
                <ProjectOwnerTimeVestingPage />
              </RolesAuthRouteGuard>
            ),
          },
        ],
      },
      {
        path: "/success",
        children: [
          {
            path: "offer-submit",
            element: <OfferSubmittedSuccessPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: "/__admin",
        element: <AdminPage />,
      },
      {
        path: "/__admin/projects",
        element: <ProjectsPage />,
      },
      {
        path: "/__admin/kol",
        element: <KolPage />,
      },
    ],
  },
]);
