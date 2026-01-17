/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as activityLogs from "../activityLogs.js";
import type * as ai_cardScanner from "../ai/cardScanner.js";
import type * as ai_chatbot from "../ai/chatbot.js";
import type * as ai_chatbotQueries from "../ai/chatbotQueries.js";
import type * as ai_conditionGrader from "../ai/conditionGrader.js";
import type * as ai_internalMutations from "../ai/internalMutations.js";
import type * as ai_openai from "../ai/openai.js";
import type * as ai_quizGenerator from "../ai/quizGenerator.js";
import type * as ai_quizHelpers from "../ai/quizHelpers.js";
import type * as ai_rateLimit from "../ai/rateLimit.js";
import type * as ai_recommendations from "../ai/recommendations.js";
import type * as ai_recommendationsHelpers from "../ai/recommendationsHelpers.js";
import type * as ai_shoppingAssistant from "../ai/shoppingAssistant.js";
import type * as ai_shoppingAssistantHelpers from "../ai/shoppingAssistantHelpers.js";
import type * as ai_storyteller from "../ai/storyteller.js";
import type * as ai_tradeAdvisor from "../ai/tradeAdvisor.js";
import type * as ai_tradeAdvisorHelpers from "../ai/tradeAdvisorHelpers.js";
import type * as auth from "../auth.js";
import type * as avatarItems from "../avatarItems.js";
import type * as collections from "../collections.js";
import type * as conditionGuide from "../conditionGuide.js";
import type * as conflictResolution from "../conflictResolution.js";
import type * as dataBackup from "../dataBackup.js";
import type * as dataPersistence from "../dataPersistence.js";
import type * as dataPopulation from "../dataPopulation.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as levelSystem from "../levelSystem.js";
import type * as milestones from "../milestones.js";
import type * as notifications from "../notifications.js";
import type * as pinProtection from "../pinProtection.js";
import type * as profileGames from "../profileGames.js";
import type * as profiles from "../profiles.js";
import type * as rarityDefinitions from "../rarityDefinitions.js";
import type * as subscriptionLimits from "../subscriptionLimits.js";
import type * as subscriptionValidation from "../subscriptionValidation.js";
import type * as trades from "../trades.js";
import type * as tradingCalculator from "../tradingCalculator.js";
import type * as tutorialContent from "../tutorialContent.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  activityLogs: typeof activityLogs;
  "ai/cardScanner": typeof ai_cardScanner;
  "ai/chatbot": typeof ai_chatbot;
  "ai/chatbotQueries": typeof ai_chatbotQueries;
  "ai/conditionGrader": typeof ai_conditionGrader;
  "ai/internalMutations": typeof ai_internalMutations;
  "ai/openai": typeof ai_openai;
  "ai/quizGenerator": typeof ai_quizGenerator;
  "ai/quizHelpers": typeof ai_quizHelpers;
  "ai/rateLimit": typeof ai_rateLimit;
  "ai/recommendations": typeof ai_recommendations;
  "ai/recommendationsHelpers": typeof ai_recommendationsHelpers;
  "ai/shoppingAssistant": typeof ai_shoppingAssistant;
  "ai/shoppingAssistantHelpers": typeof ai_shoppingAssistantHelpers;
  "ai/storyteller": typeof ai_storyteller;
  "ai/tradeAdvisor": typeof ai_tradeAdvisor;
  "ai/tradeAdvisorHelpers": typeof ai_tradeAdvisorHelpers;
  auth: typeof auth;
  avatarItems: typeof avatarItems;
  collections: typeof collections;
  conditionGuide: typeof conditionGuide;
  conflictResolution: typeof conflictResolution;
  dataBackup: typeof dataBackup;
  dataPersistence: typeof dataPersistence;
  dataPopulation: typeof dataPopulation;
  games: typeof games;
  http: typeof http;
  levelSystem: typeof levelSystem;
  milestones: typeof milestones;
  notifications: typeof notifications;
  pinProtection: typeof pinProtection;
  profileGames: typeof profileGames;
  profiles: typeof profiles;
  rarityDefinitions: typeof rarityDefinitions;
  subscriptionLimits: typeof subscriptionLimits;
  subscriptionValidation: typeof subscriptionValidation;
  trades: typeof trades;
  tradingCalculator: typeof tradingCalculator;
  tutorialContent: typeof tutorialContent;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
