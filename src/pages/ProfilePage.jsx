import { Helmet } from "react-helmet";

export default function ProfilePage() {
  return (
    <>
      <Helmet>
        <title>Profile</title>
      </Helmet>
      <div className="w-full flex items-center justify-center min-h-screen bg-creamy">
        <h1 className="text-4xl font-medium">Profile</h1>
      </div>
    </>
  );
}
