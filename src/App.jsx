import { RouterProvider } from "react-router-dom";
import RootProvider from "./providers/RootProvider";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
