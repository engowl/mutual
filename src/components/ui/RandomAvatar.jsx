import Avatar, { genConfig } from "react-nice-avatar";

export default function RandomAvatar({ seed, className }) {
  const config = genConfig(seed);
  return <Avatar className={className} {...config} />;
}
