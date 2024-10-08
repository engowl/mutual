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
        address: "26CsThTWMaPgcLj9a8z5Tq2EEEBaMajWgP7wgeCJb4ed",
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
            price: 100,
            description: "Promote your project on Twitter",
          },
          {
            id: 'testing-joji-package-telegram',
            type: "TELEGRAM_GROUP",
            price: 100,
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
        address: "BhBjfxB7NvG4FugPg8d1HCtjRuj5UqDGgsEMxxRo1k3H",
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
            price: 0.1,
            description: "Promote your project on Twitter",
          },
          {
            id: 'testing-murad-package-telegram',
            type: "TELEGRAM_GROUP",
            price: 0.1,
            description: "Promote your project on Telegram",
          }
        ]
      }
    },
    {
      id: 'testing-ansem',
      email: 'ansem@testing.com',
      name: 'Ansem 🐂🀄️',
      role: 'INFLUENCER',
      wallet: {
        id: 'testing-ansem-wallet',
        type: 'EOA',
        address: 'BjGP2h9uw5JBQKqf9qLDN1vNh4LHXb97BKZFUQLBwooF',
        amount: 123
      },
      influencer: {
        id: 'testing-ansem-influencer',
        telegramLink: 'https://t.me/AnsemBull',
        twitterAccountId: '973261472',
        twitterAccount: {
          id: 'testing-ansem-twitter',
          name: 'Ansem 🐂🀄️',
          username: 'blknoiz06',
          profileImageUrl: 'https://pbs.twimg.com/profile_images/1840493083827269634/JRfUV2fw.jpg'
        },
        projectCriterias: [
          {
            id: 'testing-ansem-project-criteria',
            riskPreference: 'LOW',
            tokenAge: 'LESS_THAN_SEVEN_WEEKS',
            minMarketCap: 1000000,
            maxMarketCap: 10000000,
            min24hVolume: 1000000,
            tokenHolder: 1000,
            liquiditySize: 100000
          }
        ],
        packages: [
          {
            id: 'testing-ansem-package-twitter',
            type: 'TWITTER',
            price: 2,
            description: 'Promote your project on Twitter'
          },
          {
            id: 'testing-ansem-package-telegram',
            type: 'TELEGRAM_GROUP',
            price: 2,
            description: 'Promote your project on Telegram'
          }
        ]
      }
    },
    {
      id: 'testing-mitch',
      email: 'mitch@testing.com',
      name: 'mitch (rtrd/acc)',
      role: 'INFLUENCER',
      wallet: {
        id: 'testing-mitch-wallet',
        type: 'EOA',
        address: 'oqypwv5GLFEfgQ2r2wAw8WAVWACUrzX7WF2e55sQa96',
        amount: 123
      },
      influencer: {
        id: 'testing-mitch-influencer',
        telegramLink: 'https://t.me/mitchrtrd',
        twitterAccountId: '1749286265583722496',
        twitterAccount: {
          id: 'testing-mitch-twitter',
          name: 'mitch (rtrd/acc)',
          username: 'idrawline',
          profileImageUrl: 'https://pbs.twimg.com/profile_images/1774942228630134784/tzr1yvLR.jpg'
        },
        projectCriterias: [
          {
            id: 'testing-mitch-project-criteria',
            riskPreference: 'LOW',
            tokenAge: 'LESS_THAN_SEVEN_WEEKS',
            minMarketCap: 1000000,
            maxMarketCap: 10000000,
            min24hVolume: 1000000,
            tokenHolder: 1000,
            liquiditySize: 100000
          }
        ],
        packages: [
          {
            id: 'testing-mitch-package-twitter',
            type: 'TWITTER',
            price: 0.05,
            description: 'Promote your project on Twitter'
          },
          {
            id: 'testing-mitch-package-telegram',
            type: 'TELEGRAM_GROUP',
            price: 0.05,
            description: 'Promote your project on Telegram'
          }
        ]
      }
    }
    // {
    //   id: '',
    //   email: '',
    //   name: '',
    //   role: '',
    //   wallet: {
    //     id: '',
    //     type: '',
    //     address: '',
    //     amount: 123
    //   },
    //   influencer: {
    //     id: '',
    //     telegramLink: '',
    //     twitterAccountId: '',
    //     twitterAccount: {
    //       id: '',
    //       name: '',
    //       username: '',
    //       profileImageUrl: ''
    //     },
    //     projectCriterias: [
    //       {
    //         id: '',
    //         riskPreference: '',
    //         tokenAge: '',
    //         minMarketCap: 1000000,
    //         maxMarketCap: 10000000,
    //         min24hVolume: 1000000,
    //         tokenHolder: 1000,
    //         liquiditySize: 100000
    //       }
    //     ],
    //     packages: [
    //       {
    //         id: '',
    //         type: '',
    //         price: 0.0321,
    //         description: ''
    //       },
    //       {
    //         id: '',
    //         type: '',
    //         price: 0.0321,
    //         description: ''
    //       }
    //     ]
    //   }
    // }
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
