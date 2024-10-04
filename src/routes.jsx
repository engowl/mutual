import { createBrowserRouter } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import RootLayout from "./layouts/RootLayout";
import ProfilePage from "./pages/ProfilePage";
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
      {
        path: "/influencer",
        children: [
          {
            path: "offers",
            element: <InfluencerOffersPage />,
          },
          {
            path: "offers/:id",
            element: <InfluencerOffersDetailPage />,
          },
          {
            path: "profile",
            element: <InfluencerProfilePage />,
          },
          {
            path: "profile/:id",
            element: <InfluencerProfilePublicPage />,
          },
          {
            path: "message",
            element: <InfluencerMessagePage />,
          },
        ],
      },
      {
        path: "/project-owner",
        children: [
          {
            path: "browse",
            element: <ProjectOwnerBrowsePage />,
          },
          {
            path: "offers",
            element: <ProjectOwnerOffersPage />,
          },
          {
            path: "offers/:id",
            element: <ProjectOwnerOffersDetailPage />,
          },
          {
            path: "message",
            element: <ProjectOwnerMessagePage />,
          },
          {
            path: "market-cap-vesting/:influencerId",
            element: <ProjectOwnerMarketCapVestingPage />,
          },
          {
            path: "time-vesting/:influencerId",
            element: <ProjectOwnerTimeVestingPage />,
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
]);
