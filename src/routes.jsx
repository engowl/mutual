import { createBrowserRouter } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import RootLayout from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <IndexPage />,
      },
    ],
  },
]);
