export default function InfluencerProfilePage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col py-20">
        <div className="size-24 rounded-full bg-neutral-200 overflow-hidden">
          <img
            className="w-full h-full object-cover"
            alt="demo"
            src="/assets/demo/angga.png"
            width={96}
            height={96}
          />
        </div>
        <div className="mt-4">
          <p className="text-[2.5rem] leading-tight">Angga Andinata</p>
          <p className="font-medium text-neutral-600">@anggaandinata</p>
        </div>
        <div className="w-full flex items-center justify-between mt-8">
          {/* Account stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="font-medium">81.6K</p>
              <p className="text-sm">Followers</p>
            </div>
            <div>
              <p className="font-medium">41.5%</p>
              <p className="text-sm">Engagement</p>
            </div>
            <div>
              <p className="font-medium">80%</p>
              <p className="text-sm">Success</p>
            </div>
          </div>
          {/* Tags */}
          <div className="flex items-center gap-3 text-sm">
            <p className="px-5 py-1.5 border rounded-full border-black/10">
              DeFi
            </p>
            <p className="px-5 py-1.5 border rounded-full border-black/10">
              NFT
            </p>
            <p className="px-5 py-1.5 border rounded-full border-black/10">
              Metaverse
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-8">
          Building http://belajarbitcoin.com -@belajar_bitcoin- HODL & Utilize
          Bitcoin Dengan Cara HORRA UMUM - Bangun mesin ATM via Bitcoin
        </p>

        <div className="mt-12 flex w-full gap-6">
          <div className="bg-white rounded-2xl border p-6 flex-1">
            <p className="font-medium">Tweet Post</p>
            <p className="text-neutral-500 mt-1 text-sm">
              This price is for a single post
            </p>
            <div className="flex items-baseline gap-2 mt-7">
              <p className="text-4xl font-medium">2.31</p>
              <p className="text-xl font-medium">SOL</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-6 flex-1">
            <p className="font-medium">Telegram Group Post</p>
            <p className="text-neutral-500 mt-1 text-sm">
              This price is for a single post
            </p>
            <div className="flex items-baseline gap-2 mt-7">
              <p className="text-4xl font-medium">2.31</p>
              <p className="text-xl font-medium">SOL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
