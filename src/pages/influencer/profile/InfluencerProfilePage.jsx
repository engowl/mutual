import RandomAvatar from "../../../components/ui/RandomAvatar.jsx";
import { useMCAuth } from "../../../lib/mconnect/hooks/useMcAuth.jsx";
import useMCWallet from "../../../lib/mconnect/hooks/useMCWallet.jsx";

export default function InfluencerProfilePage() {
  const { address } = useMCWallet();
  const { user } = useMCAuth();

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="size-24 rounded-full bg-neutral-200 overflow-hidden">
          <RandomAvatar seed={address ?? "1"} className="w-full h-full" />
        </div>
        <div className="mt-4">
          <p className="text-3xl lg:text-[2.5rem] leading-tight">
            {user.influencer.twitterAccount.name}
          </p>
          <p className="font-medium text-neutral-600">
            @{user.influencer.twitterAccount.username}
          </p>
        </div>
        <div className="w-full flex flex-col items-start gap-4 xl:flex-row xl:items-center justify-between mt-8">
          {/* Account stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="font-medium">
                {user.influencer.twitterAccount.followersCount}
              </p>
              <p className="text-sm">Followers</p>
            </div>
            <div>
              <p className="font-medium">0%</p>
              <p className="text-sm">Success</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-8">
          {user.influencer.twitterAccount.description === ""
            ? "-"
            : user.influencer.twitterAccount.description}
        </p>

        <div className="mt-12 flex w-full flex-col md:flex-row gap-6">
          {user.influencer.packages.map((pkg) => {
            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border p-6 flex-1"
              >
                <p className="font-medium">
                  {pkg.type === "TWITTER"
                    ? "Tweet Post"
                    : "Telegram Group Post"}
                </p>
                <p className="text-neutral-500 mt-1 text-sm">
                  {pkg.description}
                </p>
                <div className="flex items-baseline gap-2 mt-7">
                  <p className="text-4xl font-medium">{pkg.price}</p>
                  <p className="text-xl font-medium">SOL</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
