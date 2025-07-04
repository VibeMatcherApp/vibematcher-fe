"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/store/auth";
import { useSepoliaProvider, useWalletProvider } from "@/app/providers";
import { SAMPLE_QUESTIONS, Question } from "@/mockdata";
import {
  getRizzTokenContract,
  getMultiplierContract,
  getVibeGameContract,
  rizzToken_balanceOf,
  rizzToken_transfer,
  rizzToken_approve,
  rizzToken_mint,
  multiplier_getRequestStatus,
  multiplier_requestRandomWords,
  vibeGame_startGame,
  vibeGame_answerQuestion,
  vibeGame_claim,
  vibeGame_finishGame,
  vibeGame_forfeit,
  vibeGame_games,
} from "@/utils/contracts";

interface GameState {
  currentQuestion: number;
  score: number;
  rizzBalance: number;
  stakedAmount: number;
  multiplier: number;
  gameStarted: boolean;
  gameEnded: boolean;
  questions: Question[];
  userAnswers: number[];
  results: { correct: boolean; earned: number; lost: number }[];
}

export default function QuizPage() {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const { user } = useAuthStore();
  const walletProvider = useWalletProvider();
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    score: 0,
    rizzBalance: 1000, // Initial RIZZ balance
    stakedAmount: 0,
    multiplier: 1,
    gameStarted: false,
    gameEnded: false,
    questions: [],
    userAnswers: [],
    results: [],
  });

  const [stakeInput, setStakeInput] = useState<string>("100");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [contractResult, setContractResult] = useState<string>("");
  const [realRizzBalance, setRealRizzBalance] = useState<string>("0");
  const [rizzDecimals, setRizzDecimals] = useState<number>(18);

  useEffect(() => {
    if (!authenticated || !user) {
      router.push("/");
      return;
    }
    
    // Fetch real balance when user is authenticated
    fetchRizzBalance();
    // handleBalanceOf();
  }, [authenticated, user, router, walletProvider]);

  useEffect(() => {
    console.log(realRizzBalance)
  }, [realRizzBalance])

  // Fetch real RIZZ balance from smart contract
  const fetchRizzBalance = async () => {
    if (!walletProvider || !user?.wallet) return;
    
    try {
      const provider = await walletProvider;
      if (!provider) return;
      
      const contract = getRizzTokenContract(provider);
      const balance = await rizzToken_balanceOf(contract, user.wallet);
      const decimals = await contract.decimals();
      setRizzDecimals(decimals);
      
      // Convert balance to show multiplied by 10^9
      const formattedBalance = (Number(balance/BigInt(1000000000)).toString());
      setRealRizzBalance(formattedBalance);
    } catch (e) {
      console.error("Error fetching RIZZ balance:", e);
    }
  };

  // Generate random multiplier (1x - 5x)
  const generateRandomMultiplier = () => {
    const multipliers = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    return multipliers[Math.floor(Math.random() * multipliers.length)];
  };

  // Start game with smart contract
  const startGameWithContract = async () => {
    if (!walletProvider || !user?.wallet) {
      alert('Provider or user address not available')
      return
    }

    const stakeAmount = parseInt(stakeInput)
    if (stakeAmount <= 0) {
      alert('Invalid stake amount!')
      return
    }

    try {
      const provider = await walletProvider
      if (!provider) {
        alert('Provider not available')
        return
      }

      const signer = await provider.getSigner()
      const rizzContract = getRizzTokenContract(signer)
      const gameContract = getVibeGameContract(signer)

      // Convert stake amount to wei (using 9 decimals)
      const stakeInWei = BigInt(stakeAmount) * BigInt(10 ** 9)

      // Approve RIZZ tokens for the game contract
      const approveTx = await rizzContract.approve(await gameContract.getAddress(), stakeInWei)
      await approveTx.wait()

      // Start the game
      // const finishtx = await vibeGame_finishGame(gameContract);
      // await finishtx.wait()
      const startTx = await vibeGame_startGame(gameContract, stakeInWei)
      await startTx.wait()

      // Update game state
      const multiplier = generateRandomMultiplier()
      const randomIndex = Math.floor(Math.random() * SAMPLE_QUESTIONS.length)
      const randomQuestion = SAMPLE_QUESTIONS[randomIndex]
      
      setGameState(prev => ({
        ...prev,
        gameStarted: true,
        stakedAmount: stakeAmount,
        multiplier,
        currentQuestion: 0,
        userAnswers: [],
        results: [],
        questions: [randomQuestion]
      }))

      // Refresh balance
      fetchRizzBalance()
      setContractResult(`Game started with ${stakeAmount} RIZZ staked`)
    } catch (e) {
      setContractResult(`Error starting game: ${(e as Error).message}`)
    }
  }

  // Submit answer with smart contract
  const submitAnswerWithContract = async () => {
    if (selectedAnswer === null || !walletProvider || !user?.wallet) return

    setIsAnswering(true)
    const currentQ = gameState.questions[gameState.currentQuestion]
    const isCorrect = selectedAnswer === currentQ.correctAnswer
    
    try {
      const provider = await walletProvider
      if (!provider) {
        setContractResult('Provider not available')
        return
      }

      const signer = await provider.getSigner()
      // const gameContract = getVibeGameContract(signer)

      // For now, use a mock request ID since we're not using VRF
      const mockRequestId = 1
      
      // Answer the question
      // const answerTx = await gameContract.answerQuestion(isCorrect, mockRequestId)
      // await answerTx.wait()

      // Calculate rewards using local multiplier for display
      const stakeAmount = gameState.stakedAmount
      const multiplier = gameState.multiplier
      
      let earned = 0
      let lost = 0

      if (isCorrect) {
        earned = Math.floor(stakeAmount * multiplier)
      } else {
        lost = stakeAmount
      }

      const newResult = { correct: isCorrect, earned, lost }
      
      setGameState(prev => ({
        ...prev,
        userAnswers: [...prev.userAnswers, selectedAnswer],
        results: [...prev.results, newResult],
        score: isCorrect ? prev.score + 1 : prev.score
      }))
      
      setShowResult(true)
      setIsAnswering(false)
      const gameContract = getVibeGameContract(signer)
      const finishtx = await vibeGame_finishGame(gameContract);
      await finishtx.wait();
      setContractResult(`Question answered: ${isCorrect ? 'Correct' : 'Wrong'} with multiplier ${multiplier}x`)
    } catch (e) {
      setContractResult(`Error answering question: ${(e as Error).message}`)
      setIsAnswering(false)
    }
  }

  // Finish game with smart contract
  const finishGameWithContract = async () => {
    if (!walletProvider || !user?.wallet) return

    try {
      const provider = await walletProvider
      if (!provider) {
        setContractResult('Provider not available')
        return
      }

      const signer = await provider.getSigner()
      const gameContract = getVibeGameContract(signer)

      const finishTx = await gameContract.finishGame()
      await finishTx.wait()

      setGameState(prev => ({
        ...prev,
        gameEnded: true
      }))

      setContractResult('Game finished successfully')
    } catch (e) {
      setContractResult(`Error finishing game: ${(e as Error).message}`)
    }
  }

  // Claim rewards with smart contract
  const claimRewardsWithContract = async () => {
    if (!walletProvider || !user?.wallet) return

    try {
      const provider = await walletProvider
      if (!provider) {
        setContractResult('Provider not available')
        return
      }

      const signer = await provider.getSigner()
      const rizzContract = getRizzTokenContract(signer)
      
      // Calculate reward amount: stake amount * multiplier
      const stakeAmount = gameState.stakedAmount
      const multiplier = gameState.multiplier
      const rewardAmount = stakeAmount * multiplier
      
      // Convert to wei with 10^9 decimals
      const rewardInWei = BigInt(rewardAmount) * BigInt(10 ** 9)
      
      // Mint RIZZ tokens to the user as reward
      const mintTx = await rizzContract.mint(user.wallet, rewardInWei)
      await mintTx.wait()

      // Refresh balance
      fetchRizzBalance()
      setContractResult(`Rewards claimed successfully: ${rewardAmount} RIZZ minted (${rewardInWei} wei)`)
    } catch (e) {
      setContractResult(`Error claiming rewards: ${(e as Error).message}`)
    }
  }

  // Start game
  const startGame = () => {
    startGameWithContract()
  }

  // Submit answer
  const submitAnswer = () => {
    submitAnswerWithContract()
  }

  // Next question
  const nextQuestion = () => {
    finishGameWithContract()
    setSelectedAnswer(null)
    setShowResult(false)
  }

  // Reset game
  const resetGame = () => {
    setGameState({
      currentQuestion: 0,
      score: 0,
      rizzBalance: 1000,
      stakedAmount: 0,
      multiplier: 1,
      gameStarted: false,
      gameEnded: false,
      questions: [],
      userAnswers: [],
      results: [],
    });
    setStakeInput("100");
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Refresh balance after transactions
  const handleBalanceOf = async () => {
    if (!walletProvider || !user?.wallet) {
      setContractResult("Provider or user address not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const contract = getRizzTokenContract(provider);

      const result = await rizzToken_balanceOf(contract, user.wallet);
      const decimals = await contract.decimals();
      const formattedBalance = (Number(result/BigInt(1000000000))).toString();
      
      setContractResult(`RizzToken.balanceOf: ${formattedBalance} RIZZ`);
      setRealRizzBalance(formattedBalance); // Update real balance
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleTransfer = async () => {
    if (!walletProvider || !user?.wallet) {
      setContractResult("Provider or user address not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getRizzTokenContract(signer);
      const result = await rizzToken_transfer(contract, user.wallet, 1);
      setContractResult(`RizzToken.transfer: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleApprove = async () => {
    if (!walletProvider || !user?.wallet) {
      setContractResult("Provider or user address not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getRizzTokenContract(signer);
      const result = await rizzToken_approve(contract, user.wallet, 1);
      setContractResult(`RizzToken.approve: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleMint = async () => {
    if (!walletProvider || !user?.wallet) {
      setContractResult("Provider or user address not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getRizzTokenContract(signer);
      const result = await rizzToken_mint(
        contract,
        user.wallet,
        1_000_000_000_000_000
      );
      setContractResult(`RizzToken.mint: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleGetRequestStatus = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const contract = getMultiplierContract(provider);
      const result = await multiplier_getRequestStatus(contract, 1);
      setContractResult(
        `Multiplier.getRequestStatus: ${JSON.stringify(result)}`
      );
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleRequestRandomWords = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getMultiplierContract(signer);
      const result = await multiplier_requestRandomWords(contract, 1);
      setContractResult(`Multiplier.requestRandomWords: ${result.toString()}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameStart = async () => {
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getVibeGameContract(signer);
      const result = await vibeGame_startGame(contract, 1);
      setContractResult(`VibeGame.startGame: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameAnswer = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getVibeGameContract(signer);
      const result = await vibeGame_answerQuestion(contract, true, 1);
      setContractResult(`VibeGame.answerQuestion: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameClaim = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getVibeGameContract(signer);
      const result = await vibeGame_claim(contract);
      setContractResult(`VibeGame.claim: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameFinish = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getVibeGameContract(signer);
      const result = await vibeGame_finishGame(contract);
      setContractResult(`VibeGame.finishGame: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameForfeit = async () => {
    if (!walletProvider) {
      setContractResult("Provider not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const signer = await provider.getSigner();
      const contract = getVibeGameContract(signer);
      const result = await vibeGame_forfeit(contract);
      setContractResult(`VibeGame.forfeit: ${result.hash}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };
  const handleVibeGameGames = async () => {
    if (!walletProvider || !user?.wallet) {
      setContractResult("Provider or user address not available");
      return;
    }
    try {
      const provider = await walletProvider;
      if (!provider) {
        setContractResult("Provider not available");
        return;
      }
      const contract = getVibeGameContract(provider);
      const result = await vibeGame_games(contract, user.wallet);
      setContractResult(`VibeGame.games: ${JSON.stringify(result)}`);
    } catch (e) {
      setContractResult(`Error: ${(e as Error).message}`);
    }
  };

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Please log in to continue</p>
      </div>
    );
  }

  const currentQuestion = gameState.questions[gameState.currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Game title and balance */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 RIZZ Quiz Challenge
          </h1>
          <div className="bg-white rounded-lg shadow-md p-4 inline-block">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">RIZZ Balance</p>
                <p className="text-2xl font-bold text-primary">
                  {realRizzBalance}
                </p>
              </div>
              {gameState.gameStarted && (
                <>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Current Multiplier</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {gameState.multiplier}x
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-green-500">
                      {gameState.score}/{gameState.questions.length}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Before game starts */}
        {!gameState.gameStarted && !gameState.gameEnded && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ready to Start the Challenge!
            </h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Set stake amount per question:
              </p>
              <div className="flex items-center justify-center gap-4">
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  min="1"
                  max={gameState.rizzBalance}
                  className="w-32 px-4 py-2 border-2 border-gray-600 rounded-lg text-center text-xl font-bold text-gray-800 bg-gray-50 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-lg font-medium text-gray-700">RIZZ</span>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Game Rules:
              </h3>
              <ul className="text-sm text-yellow-700 text-left space-y-1">
                <li>• Stake RIZZ tokens before each question</li>
                <li>• Each question has a random multiplier (1x - 5x)</li>
                <li>• Correct answer: Earn stake amount × multiplier</li>
                <li>• Wrong answer: Lose all staked amount</li>
                <li>• Total of {gameState.questions.length} questions</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              disabled={
                parseInt(stakeInput) <= 0 ||
                parseInt(stakeInput) > gameState.rizzBalance
              }
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Challenge
            </button>
          </div>
        )}

        {/* Game in progress */}
        {gameState.gameStarted && !gameState.gameEnded && !showResult && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Question {gameState.currentQuestion + 1} /{" "}
                  {gameState.questions.length}
                </span>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {gameState.multiplier}x Multiplier
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((gameState.currentQuestion + 1) /
                        gameState.questions.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {currentQuestion.category}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-2">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    disabled={isAnswering}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === index
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-gray-300 hover:border-gray-500 hover:bg-gray-100 text-gray-800"
                    } ${isAnswering ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + index)}.{" "}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Stake Amount:{" "}
                <span className="font-bold text-primary">
                  {gameState.stakedAmount} RIZZ
                </span>
              </div>
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || isAnswering}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAnswering ? "Processing..." : "Confirm Answer"}
              </button>
            </div>
          </div>
        )}

        {/* Show answer result */}
        {showResult && !gameState.gameEnded && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                gameState.results[gameState.results.length - 1]?.correct
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {gameState.results[gameState.results.length - 1]?.correct ? (
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            <h3
              className={`text-2xl font-bold mb-4 ${
                gameState.results[gameState.results.length - 1]?.correct
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {gameState.results[gameState.results.length - 1]?.correct
                ? "Correct!"
                : "Wrong!"}
            </h3>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">Correct Answer:</p>
              <p className="text-lg font-medium text-gray-900">
                {String.fromCharCode(65 + currentQuestion.correctAnswer)}.{" "}
                {currentQuestion.options[currentQuestion.correctAnswer]}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg mb-6 ${
                gameState.results[gameState.results.length - 1]?.correct
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {gameState.results[gameState.results.length - 1]?.correct ? (
                <p className="text-green-800">
                  Earned{" "}
                  <span className="font-bold">
                    {gameState.results[gameState.results.length - 1]?.earned}{" "}
                    RIZZ
                  </span>
                </p>
              ) : (
                <p className="text-red-800">
                  Lost{" "}
                  <span className="font-bold">
                    {gameState.results[gameState.results.length - 1]?.lost} RIZZ
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={nextQuestion}
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {gameState.currentQuestion < gameState.questions.length - 1
                ? "Next Question"
                : "View Results"}
            </button>
            
            {/* Show claim button only for correct answers */}
            {gameState.results[gameState.results.length - 1]?.correct && (
              <button
                onClick={claimRewardsWithContract}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors ml-4"
              >
                Claim Reward
              </button>
            )}
          </div>
        )}

        {/* Game ended */}
        {gameState.gameEnded && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🎉 Challenge Complete!
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Total Score
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {gameState.score}/{gameState.questions.length}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Final Balance
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {gameState.rizzBalance} RIZZ
                </p>
              </div>
              <div
                className={`p-6 rounded-lg ${
                  gameState.rizzBalance >= 1000 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    gameState.rizzBalance >= 1000
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  Profit/Loss
                </h3>
                <p
                  className={`text-3xl font-bold ${
                    gameState.rizzBalance >= 1000
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {gameState.rizzBalance >= 1000 ? "+" : ""}
                  {gameState.rizzBalance - 1000} RIZZ
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detailed Results
              </h3>
              <div className="space-y-2">
                {gameState.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-600">Question {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          result.correct
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.correct ? "Correct" : "Wrong"}
                      </span>
                      <span
                        className={`font-bold ${
                          result.correct ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {result.correct
                          ? `+${result.earned}`
                          : `-${result.lost}`}{" "}
                        RIZZ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetGame}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={claimRewardsWithContract}
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors ml-4"
            >
              Claim Rewards
            </button>
          </div>
        )}

        {/* Add this section at the bottom of the main return, only for authenticated users */}
        {/* {authenticated && user && (
          <div className="mt-12 p-6 bg-gray-100 rounded-xl">
            <h2 className="text-xl font-bold mb-4">
              Smart Contract Function Demo
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleBalanceOf}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                RizzToken.balanceOf
              </button>
              <button
                onClick={handleTransfer}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                RizzToken.transfer
              </button>
              <button
                onClick={handleApprove}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                RizzToken.approve
              </button>
              <button
                onClick={handleMint}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                RizzToken.mint
              </button>
              <button
                onClick={handleGetRequestStatus}
                className="bg-purple-500 text-white px-4 py-2 rounded"
              >
                Multiplier.getRequestStatus
              </button>
              <button
                onClick={handleRequestRandomWords}
                className="bg-purple-500 text-white px-4 py-2 rounded"
              >
                Multiplier.requestRandomWords
              </button>
              <button
                onClick={handleVibeGameStart}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.startGame
              </button>
              <button
                onClick={handleVibeGameAnswer}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.answerQuestion
              </button>
              <button
                onClick={handleVibeGameClaim}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.claim
              </button>
              <button
                onClick={handleVibeGameFinish}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.finishGame
              </button>
              <button
                onClick={handleVibeGameForfeit}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.forfeit
              </button>
              <button
                onClick={handleVibeGameGames}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                VibeGame.games
              </button>
            </div>
            <div className="bg-white p-4 rounded shadow text-sm text-gray-800">
              {contractResult}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
