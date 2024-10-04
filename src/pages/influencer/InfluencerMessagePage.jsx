import { Phone, Search } from "lucide-react";

export default function InfluencerMessagePage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col py-20">
        <div className="w-full flex">
          <div className="p-6 border rounded-2xl bg-white w-full max-w-sm">
            <p className="font-medium text-3xl">Messages</p>
            <div className="mt-6 flex flex-col">
              {/* Message */}
              <div className="flex items-center gap-4 px-3 py-3 bg-orangy/5 rounded-lg">
                <div className="size-8 rounded-full bg-neutral-200"></div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">Angga Andinata</p>
                  <p className="text-neutral-500 text-xs">
                    Hi, I&apos;m interested in your offer
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Message Box */}
          <div className="p-6 border rounded-2xl bg-white flex-1 ml-6">
            <div className="w-full">
              <div className="w-full flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="size-10 bg-neutral-200 rounded-full"></div>
                  <div>
                    <p className="font-medium">Angga Andinata</p>
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <span className="size-2 bg-green-700 rounded-full"></span>
                      <p>Active Now</p>
                    </div>
                  </div>
                </div>

                {/* Call and search */}
                <div className="flex items-center gap-4">
                  <button className="size-8 bg-green-700 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </button>
                  <button className="size-8 bg-neutral-200 rounded-full flex items-center justify-center">
                    <Search className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
              {/* Message chat */}
              <div className="mt-4 rounded-2xl bg-creamy-300 min-h-[412px]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
