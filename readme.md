# MUTUAL 🚀

![MUTUAL Pages](https://github.com/user-attachments/assets/8f7ff17b-af66-4ba3-bc34-cddd93494513)

**Deployment:** [mutual-ism.vercel.app](https://mutual-ism.vercel.app)

**MUTUAL** is a secure and efficient platform designed to bridge collaborations between crypto projects and influencers within the Solana ecosystem. Leveraging smart contracts and on-chain token data, MUTUAL ensures transparent and trustworthy partnerships, fostering a thriving environment for promotional activities.

---

## Table of Contents 📚

1. [Introduction 👋](#introduction-)
2. [Platform Overview](#platform-overview-)
3. [Main Features](#main-features-)
   - [🔒 Escrow Payment System](#-escrow-payment-system)
   - [💬 Communication](#-communication)
   - [🔍 Advanced Filtering Options](#-advanced-filtering-options)
   - [🔒 Time and Marketcap Vesting](#-time-and-marketcap-vesting)
   - [✅ Verification and Safety Checks](#-verification-and-safety-checks)
   - [⭐ Reputation and Review System](#-reputation-and-review-system)
4. [Technical Architecture](#technical-architecture)
   - [🛠️ Escrow Smart Contract](#️-escrow-smart-contract)
   - [🌐 Frontend](#-frontend)
   - [🔧 Backend](#-backend)
5. [Development Highlights](#development-highlights-)
   - [🔐 MPC Wallet Integration](#-mpc-wallet-integration)
   - [💡 Custom Escrow Smart Contract](#-custom-escrow-smart-contract)
6. [Conclusion](#conclusion-)

---

## Introduction 👋

In the rapidly evolving **Solana** ecosystem, fostering trustworthy and efficient collaborations between crypto projects and influencers is crucial. **MUTUAL** serves as a dedicated marketplace that bridges this gap, ensuring secure, transparent, and mutually beneficial partnerships. By leveraging smart contracts and on-chain token data, MUTUAL provides a reliable framework that safeguards the interests of both project owners and influencers, fostering a thriving environment for promotional activities within the crypto space.

---

## Platform Overview 🌟

**MUTUAL** operates as a specialized marketplace connecting crypto projects with influencers. Inspired by platforms like Fiverr, MUTUAL tailors its services to the unique demands of the crypto industry. The platform ensures seamless and secure collaborations by utilizing advanced blockchain technologies to mitigate risks associated with fraud and miscommunication.

### Key Objectives 🎯

- **🔒 Security:** Implement robust mechanisms to protect transactions and data.
- **🔍 Transparency:** Ensure all dealings are traceable and verifiable on-chain.
- **⚡ Efficiency:** Facilitate swift and effective communication and transactions.
- **🤝 Trust:** Build a reliable reputation system to maintain high-quality engagements.

---

## Main Features ✨

### 🔒 Escrow Payment System

At the heart of MUTUAL lies its **Escrow Payment System**, designed to protect both influencers and project owners. This system securely holds funds in escrow until the agreed-upon promotional services are delivered, ensuring that neither party is exposed to potential fraud.

**Key Components:**

- **Secure Fund Holding:** Funds are locked in a smart contract, preventing premature withdrawal.
- **Conditional Release:** Payments are released based on predefined conditions, such as the completion of specific tasks.
- **Dispute Resolution:** In case of disagreements, funds can be returned or reallocated based on mutually agreed terms.

### 💬 Communication

Effective collaboration hinges on clear and prompt communication. MUTUAL integrates **Blazingly Fast Chat Features** to facilitate seamless interaction between influencers and project owners.

**Features:**

- **📩 Real-Time Messaging:** Instantaneous communication ensures timely updates and clarifications.
- **📂 Threaded Conversations:** Organize discussions by topics or milestones for better tracking.
- **🔔 Notification System:** Alerts keep both parties informed about important messages and updates.

### 🔍 Advanced Filtering Options

Finding the right collaborator can be challenging. MUTUAL’s **Advanced Filtering Options** simplify this process by allowing users to narrow down potential partners based on specific criteria.

**Filtering Criteria:**

- **📊 Market Cap:** Align collaborations with projects of compatible sizes.
- **👥 Audience Demographics:** Target influencers whose audiences match the project's desired reach.
- **📈 Engagement Rates:** Select influencers with proven interaction levels.
- **🎯 Marketing Needs:** Tailor searches based on specific promotional requirements.

### 🔒 Time and Marketcap Vesting

To promote long-term engagement and stability, MUTUAL incorporates **Time-Based and Marketcap-Based Vesting** mechanisms.

**Time-Based Vesting:**

- **⏱️ Duration Specification:** Define vesting periods in seconds.
- **📆 Progressive Unlocking:** Tokens are released gradually, correlating with elapsed time.
- **🔓 Flexible Claims:** Influencers can claim tokens proportionally based on the time elapsed.

**Marketcap-Based Vesting:**

- **📈 Eligibility Conditions:** Vesting is contingent upon reaching predefined market cap milestones.
- **🔍 Backend Verification:** The MUTUAL backend continuously monitors and verifies market cap achievements.
- **👮 Admin Control:** Only authorized wallets can set and adjust eligibility based on verified data.

### ✅ Verification and Safety Checks

Ensuring the legitimacy of both project owners and influencers is crucial. MUTUAL implements comprehensive **Verification and Safety Checks** to minimize the risk of scams and fraudulent activities.

**Verification Processes:**

- **🆔 Identity Verification:** Confirm the identities of all users through secure methods.
- **🔍 Project Validation:** Assess the legitimacy and viability of crypto projects before allowing participation.
- **🔄 Continuous Monitoring:** Regular checks to maintain ongoing compliance and trustworthiness.

### ⭐ Reputation and Review System

Maintaining high-quality engagements is facilitated by MUTUAL’s **Reputation and Review System**, allowing users to provide feedback and ratings post-collaboration.

**System Features:**

- **🔄 Two-Way Reviews:** Both influencers and project owners can rate each other, ensuring balanced feedback.
- **🌐 Public Ratings:** Transparent ratings help future users make informed decisions.
- **🏆 Quality Assurance:** High-rated users are highlighted, promoting excellence within the community.

---

## Technical Architecture

MUTUAL’s architecture is meticulously designed to ensure scalability, security, and a seamless user experience. The platform comprises three primary components: the **Escrow Smart Contract**, the **Frontend**, and the **Backend**.

### 🛠️ Escrow Smart Contract

Developed in **Rust**, the **Escrow Smart Contract** is the cornerstone of MUTUAL’s financial interactions. It supports all types of SPL tokens and manages various vesting conditions to ensure secure and conditional fund releases.

**Functionalities:**

- **🔧 Deal Creation:** Users initiate deals by transferring tokens to the escrow, referencing the order ID and related data.
- **✅ Acceptance Workflow:** Influencers can accept or reject deals, with rejected deals resulting in fund refunds.
- **💸 Payment Steps:** 
  - **Initial Payment:** Upon fulfilling the first obligation (e.g., posting a tweet), 20% of the payment tokens are unlocked.
  - **Vesting Conditions:** The remaining tokens are released based on time or market cap conditions.

**Vesting Mechanisms:**

- **⏳ Time-Based Vesting:** Calculates claimable amounts based on the specified duration, allowing partial claims proportional to time elapsed.
- **📈 Marketcap-Based Vesting:** Relies on backend-verified market cap thresholds to determine eligibility for token releases.

### 🌐 Frontend

The **Frontend** of MUTUAL is built with **ReactJS**, offering distinct interfaces tailored to three user roles: Influencers, Project Owners, and Admins.

**User Interfaces:**

- **👩‍💼 Influencer Side:**
  - Browse and apply for deals.
  - Track deal progress and manage tasks.
  - View payment schedules and claim tokens.
  
- **👨‍💼 Project Owner Side:**
  - Create and manage promotional deals.
  - Monitor influencer performance and engagement.
  - Adjust vesting conditions and manage funds.

- **🛡️ Admin Side:**
  - Oversee platform operations and enforce policies.
  - Handle dispute resolutions and verify market cap conditions.
  - Manage user verifications and safety checks.

### 🔧 Backend

The **Backend** ensures that all business logic and workflows are executed correctly, maintaining synchronization with the smart contract states.

**Technologies Used:**

- **🟢 NodeJS:** Powers the server-side logic and handles API requests.
- **🛢️ Prisma ORM:** Manages database interactions efficiently.
- **💾 PostgreSQL:** Serves as the primary database, storing user data, deal information, and transaction records.

**Core Responsibilities:**

- **⚖️ Business Logic Enforcement:** Ensures that all platform operations adhere to predefined rules and conditions.
- **🔗 Contract State Integration:** Synchronizes backend processes with the smart contract’s current state for consistency.
- **🗄️ Data Management:** Handles secure storage and retrieval of user information, deal details, and transactional data.

---

## Development Highlights 🌟

### 🔐 MPC Wallet Integration

MUTUAL enhances user authentication and security through **MPC (Multi-Party Computation) Wallet Integration**. By incorporating **Portal** ([portalhq.io](https://www.portalhq.io/)) and developing an SDK named **MCONNECT**, MUTUAL simplifies the MPC wallet sign-in process.

**Key Features:**

- **🔄 Seamless Integration:** MCONNECT allows easy addition of MPC wallet sign-in, leveraging Portal’s infrastructure.
- **🔒 Enhanced Security:** MPC ensures that private keys are never exposed, enhancing overall platform security.
- **🖥️ User-Friendly Experience:** Similar to Thirdweb’s wallet modal, the integration provides a familiar and intuitive sign-in process using Google authentication via Portal.

### 💡 Custom Escrow Smart Contract

The development of a **Custom Escrow Smart Contract** in Rust is a significant achievement, tailored to meet MUTUAL’s specific needs.

**Highlights:**

- **🔗 Comprehensive Support:** Compatible with all SPL tokens, ensuring flexibility in token transactions.
- **🔒 Conditional Constraints:** Implements strict conditions for fund movement, ensuring funds are only sent to the intended recipients upon meeting deal requirements.
- **🛡️ Enhanced Security:** While not entirely trustless, the contract introduces additional safeguards to mitigate risks associated with escrow transactions.

**Operational Flow:**

1. **🔄 Deal Initiation:** A user creates a deal by transferring tokens to the escrow, referencing the order ID and other relevant data.
2. **🤔 Influencer Decision:** The Key Opinion Leader (KOL) can accept or reject the deal.
   - **❌ Rejection:** Funds are returned to the project owner.
   - **✅ Acceptance:** The deal proceeds to the payment steps.
3. **💰 Payment Execution:** 
   - **🔓 First Payment:** Upon completion of the initial obligation, 20% of the tokens are released.
   - **⏳ Vesting-Based Payments:** Remaining tokens are released based on either time or market cap vesting conditions.

---

## Conclusion 🎉

**MUTUAL** stands as a robust platform designed to facilitate secure and effective collaborations between crypto projects and influencers within the Solana ecosystem. By integrating advanced smart contract functionalities, comprehensive verification processes, and user-centric interfaces, MUTUAL addresses the critical needs of transparency, security, and efficiency in promotional engagements. The platform’s thoughtful architecture and feature-rich environment not only safeguard the interests of all parties involved but also promote sustained and meaningful partnerships, contributing to the dynamic growth of the Solana token ecosystem.

---

*This documentation is maintained and updated regularly to reflect the latest developments and features of MUTUAL. For the most current information, please refer to the [official repository](https://github.com/engowl/mutual).*

*Made with ❤️ by the MUTUAL Team*
