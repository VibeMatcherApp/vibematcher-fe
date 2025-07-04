export interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  category: string
}

export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the main characteristic of blockchain?",
    options: ["Centralized", "Decentralized", "Private", "Commercial"],
    correctAnswer: 1,
    category: "Blockchain Basics"
  },
  {
    id: 2,
    question: "Who is the creator of Bitcoin?",
    options: ["Vitalik Buterin", "Satoshi Nakamoto", "Charlie Lee", "Roger Ver"],
    correctAnswer: 1,
    category: "Cryptocurrency"
  },
  {
    id: 3,
    question: "What is Ethereum's native token?",
    options: ["BTC", "ETH", "LTC", "XRP"],
    correctAnswer: 1,
    category: "Ethereum"
  },
  {
    id: 4,
    question: "What is a smart contract?",
    options: ["Paper contract", "Self-executing code", "Legal document", "Bank agreement"],
    correctAnswer: 1,
    category: "Smart Contracts"
  },
  {
    id: 5,
    question: "What does NFT stand for?",
    options: ["New Financial Token", "Non-Fungible Token", "Network File Transfer", "Next Future Technology"],
    correctAnswer: 1,
    category: "NFT"
  },
  {
    id: 6,
    question: "What is DeFi?",
    options: ["Decentralized Finance", "Digital Finance", "Direct Finance", "Distributed Finance"],
    correctAnswer: 0,
    category: "DeFi"
  },
  {
    id: 7,
    question: "What consensus mechanism does Bitcoin use?",
    options: ["Proof of Stake", "Proof of Work", "Delegated Proof of Stake", "Proof of Authority"],
    correctAnswer: 1,
    category: "Consensus"
  },
  {
    id: 8,
    question: "What is a cryptocurrency wallet?",
    options: ["Physical wallet", "Digital storage for crypto", "Bank account", "Credit card"],
    correctAnswer: 1,
    category: "Wallets"
  }
] 