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
import type * as pinProtection from "../pinProtection.js";
import type * as profileGames from "../profileGames.js";
import type * as profiles from "../profiles.js";
import type * as rarityDefinitions from "../rarityDefinitions.js";
import type * as registration from "../registration.js";
import type * as subscriptionLimits from "../subscriptionLimits.js";
import type * as subscriptionValidation from "../subscriptionValidation.js";
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
  pinProtection: typeof pinProtection;
  profileGames: typeof profileGames;
  profiles: typeof profiles;
  rarityDefinitions: typeof rarityDefinitions;
  registration: typeof registration;
  subscriptionLimits: typeof subscriptionLimits;
  subscriptionValidation: typeof subscriptionValidation;
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
