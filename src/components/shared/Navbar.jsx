import SignInButton from "./SignInButton";

export default function Navbar() {
  return (
    <nav className="h-12 flex items-center px-8 justify-between border-b border-black/20">
      <p className="text-xl font-medium">MUTUAL</p>
      <SignInButton />
    </nav>
  );
}
