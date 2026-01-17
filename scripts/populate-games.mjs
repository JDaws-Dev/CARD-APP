#!/usr/bin/env node
/**
 * Script to populate game data for all TCGs
 *
 * Usage:
 *   node scripts/populate-games.mjs [game]
 *
 * Examples:
 *   node scripts/populate-games.mjs           # Populate all games
 *   node scripts/populate-games.mjs yugioh    # Populate only Yu-Gi-Oh!
 *   node scripts/populate-games.mjs onepiece  # Populate only One Piece
 *   node scripts/populate-games.mjs lorcana   # Populate only Lorcana
 *   node scripts/populate-games.mjs pokemon   # Populate only Pokemon
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Get the Convex URL from environment or .env.local
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL not found in environment");
  console.error("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const GAMES = ["pokemon", "yugioh", "onepiece", "lorcana"];

async function checkStatus() {
  console.log("\n📊 Current database status:");
  const status = await client.query(api.dataPopulation.getPopulationStatus, {});
  console.log(`   Total sets: ${status.totalSets}`);
  console.log(`   Total cards: ${status.totalCards}`);
  console.log("\n   By game:");
  for (const [game, data] of Object.entries(status.byGame)) {
    console.log(`   - ${game}: ${data.setCount} sets, ${data.cardCount} cards`);
  }
  return status;
}

async function populateGame(gameSlug) {
  console.log(`\n🎮 Populating ${gameSlug}...`);
  console.log("   This may take a few minutes for large games.");

  try {
    const result = await client.action(api.dataPopulation.populateGameData, {
      gameSlug,
      // Optionally limit to recent sets to speed things up:
      // maxAgeMonths: 24,  // Only sets from last 2 years
      // maxSets: 10,       // Only first 10 sets (for testing)
    });

    console.log(`   ✅ ${gameSlug} complete!`);
    console.log(`      Sets processed: ${result.setsProcessed}`);
    console.log(`      Sets skipped: ${result.setsSkipped}`);
    console.log(`      Cards processed: ${result.cardsProcessed}`);

    if (result.errors.length > 0) {
      console.log(`      ⚠️  Errors: ${result.errors.length}`);
      result.errors.slice(0, 5).forEach(err => console.log(`         - ${err}`));
      if (result.errors.length > 5) {
        console.log(`         ... and ${result.errors.length - 5} more`);
      }
    }

    return result;
  } catch (error) {
    console.error(`   ❌ Error populating ${gameSlug}:`, error.message);
    return null;
  }
}

async function main() {
  const targetGame = process.argv[2];

  console.log("╔════════════════════════════════════════╗");
  console.log("║   CardDex Game Data Population Tool    ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\nConnecting to: ${CONVEX_URL}`);

  // Show current status
  await checkStatus();

  // Determine which games to populate
  const gamesToPopulate = targetGame
    ? (GAMES.includes(targetGame) ? [targetGame] : [])
    : GAMES;

  if (gamesToPopulate.length === 0) {
    console.error(`\n❌ Unknown game: ${targetGame}`);
    console.error(`   Valid games: ${GAMES.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🚀 Will populate: ${gamesToPopulate.join(", ")}`);

  // Populate each game
  for (const game of gamesToPopulate) {
    await populateGame(game);
  }

  // Show final status
  console.log("\n" + "═".repeat(40));
  await checkStatus();
  console.log("\n✨ Done!");
}

main().catch(console.error);
