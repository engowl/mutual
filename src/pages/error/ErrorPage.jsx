import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-medium text-orangy">404</h1>
        <p className="text-2xl font-medium text-neutral-500">
          Oops! Page Not Found
        </p>
        <Link
          to="/"
          className="text-white bg-orangy rounded-full px-5 py-2 font-medium mt-5"
        >
          Go back to home
        </Link>
      </div>
    </div>
  );
}
