import { ethers, Contract, Signer, Provider } from 'ethers';
import rizzAbi from '@/abi/rizz.json';
import multiplierAbi from '@/abi/rollingMultiplier.json';
import vibeGameAbi from '@/abi/vibegame.json';
import {
  RIZZ_TOKEN_ADDRESS,
  MULTIPLIER_ADDRESS,
  VIBE_GAME_ADDRESS
} from '@/constants/contracts';

// Returns a contract instance for RizzToken
export function getRizzTokenContract(providerOrSigner: Provider | Signer) {
  return new Contract(RIZZ_TOKEN_ADDRESS, rizzAbi.abi, providerOrSigner);
}

// Returns a contract instance for Multiplier
export function getMultiplierContract(providerOrSigner: Provider | Signer) {
  return new Contract(MULTIPLIER_ADDRESS, multiplierAbi.abi, providerOrSigner);
}

// Returns a contract instance for VibeGame
export function getVibeGameContract(providerOrSigner: Provider | Signer) {
  return new Contract(VIBE_GAME_ADDRESS, vibeGameAbi.abi, providerOrSigner);
}

// RizzToken
export function rizzToken_balanceOf(contract: Contract, account: string) {
  return contract.balanceOf(account);
}
export function rizzToken_transfer(contract: Contract, to: string, amount: ethers.BigNumberish) {
  return contract.transfer(to, amount);
}
export function rizzToken_approve(contract: Contract, spender: string, amount: ethers.BigNumberish) {
  return contract.approve(spender, amount);
}
export function rizzToken_mint(contract: Contract, to: string, amount: ethers.BigNumberish) {
  return contract.mint(to, amount);
}

// RollingMultiplier
export function multiplier_getRequestStatus(contract: Contract, requestId: ethers.BigNumberish) {
  return contract.getRequestStatus(requestId);
}
export function multiplier_requestRandomWords(contract: Contract, numWords: number) {
  return contract.requestRandomWords(numWords);
}

// VibeGame
export function vibeGame_startGame(contract: Contract, stake: ethers.BigNumberish) {
  return contract.startGame(stake);
}
export function vibeGame_answerQuestion(contract: Contract, correct: boolean, requestId: ethers.BigNumberish) {
  return contract.answerQuestion(correct, requestId);
}
export function vibeGame_claim(contract: Contract) {
  return contract.claim();
}
export function vibeGame_finishGame(contract: Contract) {
  return contract.finishGame();
}
export function vibeGame_forfeit(contract: Contract) {
  return contract.forfeit();
}
export function vibeGame_games(contract: Contract, player: string) {
  return contract.games(player);
} 