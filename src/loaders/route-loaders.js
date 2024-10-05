import { mutualAPI } from "../api/mutual";
import { redirect } from "react-router-dom";

export const indexPageLoader = async ({ request }) => {
  const { data } = await mutualAPI.get("/users/me");
  const { user } = data.data;
  return user;
};
