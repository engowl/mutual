import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const USERS = [
    {
      id: 'testing-joji',
      email: "joji@mutual.ism",
      name: "Joji",
      role: 'INFLUENCER',
      wallet: {
        id: 'testing-joji-wallet',
        type: "EOA",
        address: "66eUkcGecVqgwgrby1HBgCR5uL1U8tzcZNXMWynEwTXU",
        amount: 123
      },
      influencer: {
        id: 'testing-joji-influencer',
        telegramLink: "https://t.me/metaversejoji",
        twitterAccountId: "1392124029914566666",
        twitterAccount: {
          id: 'testing-joji-twitter',
          name: "joji",
          username: "metaversejoji",
          profileImageUrl: "https://pbs.twimg.com/profile_images/1735818999747731456/6i4SHx2m_400x400.jpg"
        },
        projectCriterias: [
          {
            id: 'testing-joji-project-criteria',
            riskPreference: "LOW",
            tokenAge: "LESS_THAN_SEVEN_WEEKS",
            minMarketCap: 1_000_000,
            maxMarketCap: 10_000_000,
            min24hVolume: 1_000_000,
            tokenHolder: 1_000,
            liquiditySize: 100_000
          }
        ],
        packages: [
          {
            id: 'testing-joji-package-twitter',
            type: "TWITTER",
            price: 0.0123,
            description: "Promote your project on Twitter",
          },
          {
            id: 'testing-joji-package-telegram',
            type: "TELEGRAM_GROUP",
            price: 0.0123,
            description: "Promote your project on Telegram",
          }
        ]
      }
    },
    {
      id: 'testing-murad',
      email: "murad@mutual.ism",
      name: "Murad",
      role: 'INFLUENCER',
      wallet: {
        id: 'testing-murad-wallet',
        type: "EOA",
        address: "3iNeQfn6UKB4b9Vh1vvFPh79AuHF1xJ6vCfyQCBJQEYc",
        amount: 123
      },
      influencer: {
        id: 'testing-murad-influencer',
        telegramLink: "https://t.me/muradism",
        twitterAccountId: "844304603336232960",
        twitterAccount: {
          id: 'testing-murad-twitter',
          name: "Murad 💹🧲",
          username: "MustStopMurad",
          profileImageUrl: "https://pbs.twimg.com/profile_images/1687753484018307072/7-qv-T9c_400x400.jpg"
        },
        projectCriterias: [
          {
            id: 'testing-murad-project-criteria',
            riskPreference: "LOW",
            tokenAge: "LESS_THAN_SEVEN_WEEKS",
            minMarketCap: 1_000_000,
            maxMarketCap: 10_000_000,
            min24hVolume: 1_000_000,
            tokenHolder: 1_000,
            liquiditySize: 100_000
          }
        ],
        packages: [
          {
            id: 'testing-murad-package-twitter',
            type: "TWITTER",
            price: 0.0321,
            description: "Promote your project on Twitter",
          },
          {
            id: 'testing-murad-package-telegram',
            type: "TELEGRAM_GROUP",
            price: 0.0321,
            description: "Promote your project on Telegram",
          }
        ]
      }
    },
  ];

  for (let user of USERS) {
    // Upsert User
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Upsert Wallet for User
    await prisma.userWallet.upsert({
      where: { id: user.wallet.id },
      update: {
        type: user.wallet.type,
        address: user.wallet.address,
        amount: user.wallet.amount,
        updatedAt: new Date()
      },
      create: {
        id: user.wallet.id,
        type: user.wallet.type,
        address: user.wallet.address,
        userId: user.id,
        amount: user.wallet.amount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Upsert TwitterAccount for Influencer first
    const twitterAccount = await prisma.twitterAccount.upsert({
      where: { id: user.influencer.twitterAccount.id },
      update: {
        accountId: user.influencer.twitterAccountId,
        name: user.influencer.twitterAccount.name,
        username: user.influencer.twitterAccount.username,
        profileImageUrl: user.influencer.twitterAccount.profileImageUrl
      },
      create: {
        accountId: user.influencer.twitterAccountId,
        id: user.influencer.twitterAccount.id,
        name: user.influencer.twitterAccount.name,
        username: user.influencer.twitterAccount.username,
        profileImageUrl: user.influencer.twitterAccount.profileImageUrl
      }
    });

    // Upsert Influencer for User after TwitterAccount is created/updated
    await prisma.influencer.upsert({
      where: { id: user.influencer.id },
      update: {
        telegramLink: user.influencer.telegramLink,
        twitterAccountId: twitterAccount.id // Use the twitterAccount id from the previous step
      },
      create: {
        id: user.influencer.id,
        userId: user.id,
        telegramLink: user.influencer.telegramLink,
        twitterAccountId: twitterAccount.id // Use the twitterAccount id from the previous step
      }
    });

    // Upsert ProjectCriteria for Influencer
    for (let criteria of user.influencer.projectCriterias) {
      await prisma.projectCriteria.upsert({
        where: { id: criteria.id },
        update: {
          riskPreference: criteria.riskPreference,
          tokenAge: criteria.tokenAge,
          minMarketCap: criteria.minMarketCap,
          maxMarketCap: criteria.maxMarketCap,
          min24hVolume: criteria.min24hVolume,
          tokenHolder: criteria.tokenHolder,
          liquiditySize: criteria.liquiditySize
        },
        create: {
          id: criteria.id,
          influencerId: user.influencer.id,
          riskPreference: criteria.riskPreference,
          tokenAge: criteria.tokenAge,
          minMarketCap: criteria.minMarketCap,
          maxMarketCap: criteria.maxMarketCap,
          min24hVolume: criteria.min24hVolume,
          tokenHolder: criteria.tokenHolder,
          liquiditySize: criteria.liquiditySize
        }
      });
    }

    // Upsert Package for Influencer
    for (let pkg of user.influencer.packages) {
      await prisma.package.upsert({
        where: { id: pkg.id },
        update: {
          type: pkg.type,
          price: pkg.price,
          description: pkg.description
        },
        create: {
          id: pkg.id,
          influencerId: user.influencer.id,
          type: pkg.type,
          price: pkg.price,
          description: pkg.description
        }
      });
    }
  }

  console.log("Initial seed complete");
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
