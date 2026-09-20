import { EducationalModule } from '../types';

export const ADMIN_EMAIL = 'xeelclick@gmail.com';
export const ADMIN_DEFAULT_PASSWORD = 'Admin1097@';

export const INITIAL_EDUCATIONAL_MODULES: EducationalModule[] = [
  {
    id: 'edu-solana-eldra',
    title: 'Solana High-Speed Architecture & Eldra Ecosystem',
    category: 'Solana & Eldra',
    summary: 'Learn why Eldra is built on the Solana Network, featuring sub-second finality, Proof-of-History (PoH), low transaction fees, and high throughput.',
    externalUrl: 'https://docs.solana.com/introduction',
    readTimeMinutes: 3,
    completionBonus: 20,
    passingScorePercentage: 75,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    isPublished: true,
    authorEmail: 'admin@eldra.io',
    questions: [
      {
        id: 'q1-1',
        question: 'Which blockchain network is Eldra Coin built on for ultra-fast transactions and minimal fees?',
        options: ['Bitcoin Network', 'Solana Network', 'Dogecoin Network', 'Litecoin Network'],
        correctOptionIndex: 1,
        explanation: 'Eldra is built directly on the high-performance Solana Network.',
        rewardAmount: 2,
      },
      {
        id: 'q1-2',
        question: 'How many Eldra tokens can a verified user claim each day from the daily faucet?',
        options: ['0.5 ELDRA', '1 ELDRA', '5 ELDRA', '10 ELDRA'],
        correctOptionIndex: 1,
        explanation: 'Every verified member can claim exactly 1 ELDRA token every 24 hours.',
        rewardAmount: 2,
      },
      {
        id: 'q1-3',
        question: 'What is the token reward given to a user for each friend they successfully refer to Eldra?',
        options: ['1 ELDRA', '2 ELDRA', '5 ELDRA', '20 ELDRA'],
        correctOptionIndex: 2,
        explanation: 'Each successful referral awards the referrer 5 ELDRA tokens instantly.',
        rewardAmount: 2,
      },
      {
        id: 'q1-4',
        question: 'What is the bonus jackpot rewarded to a user for successfully passing an educational chapter quiz?',
        options: ['5 ELDRA', '10 ELDRA', '15 ELDRA', '20 ELDRA'],
        correctOptionIndex: 3,
        explanation: 'Passing the educational quiz awards a 20 ELDRA completion jackpot on top of question points.',
        rewardAmount: 2,
      },
    ],
  },
];
