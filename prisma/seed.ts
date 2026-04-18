/**
 * prisma/seed.ts
 *
 * Seeds the database with minimal demo data so developers can get started
 * without needing real API keys.
 *
 * Run: npm run db:seed (from repo root)
 */

import { PrismaClient, SeriesStatus, MovieStatus, ReleaseType, WatchlistItemType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- Demo user ----
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
      preference: {
        create: {
          pushEnabled: true,
          emailEnabled: true,
          notifyNewEpisode: true,
          notifyMovieRelease: true,
          notifyTheaterNearby: true,
          advanceNoticeDays: 1,
        },
      },
      location: {
        create: {
          latitude: 34.0522,
          longitude: -118.2437,
          city: "Los Angeles",
          country: "US",
          radiusKm: 50,
        },
      },
    },
  });

  // ---- Demo franchise ----
  const marvelFranchise = await prisma.franchise.upsert({
    where: { tmdbId: "131292" },
    update: {},
    create: {
      name: "Marvel Cinematic Universe",
      description: "The Marvel Cinematic Universe film and TV series franchise.",
      tmdbId: "131292",
    },
  });

  // ---- Demo series ----
  const loki = await prisma.series.upsert({
    where: { tmdbId: "84958" },
    update: {},
    create: {
      title: "Loki",
      description: "The mercurial villain Loki resumes his role as the God of Mischief.",
      status: SeriesStatus.ONGOING,
      tmdbId: "84958",
      tvmazeId: "45049",
      franchiseId: marvelFranchise.id,
    },
  });

  // ---- Demo episodes ----
  await prisma.episodeRelease.upsert({
    where: { tmdbId: "loki-s3e1" },
    update: {},
    create: {
      seriesId: loki.id,
      season: 3,
      episode: 1,
      title: "Season 3 Premiere",
      airDate: new Date("2026-06-01T00:00:00Z"),
      tmdbId: "loki-s3e1",
    },
  });

  // ---- Demo movie ----
  const deadpool = await prisma.movie.upsert({
    where: { tmdbId: "567604" },
    update: {},
    create: {
      title: "Deadpool & Wolverine",
      description: "Deadpool and Wolverine team up to face a new threat.",
      status: MovieStatus.UPCOMING,
      tmdbId: "567604",
      franchiseId: marvelFranchise.id,
    },
  });

  // ---- Demo movie release ----
  await prisma.movieRelease.create({
    data: {
      movieId: deadpool.id,
      releaseType: ReleaseType.THEATRICAL,
      releaseDate: new Date("2026-07-26T00:00:00Z"),
      region: "US",
    },
  });

  // ---- Demo theater showing ----
  await prisma.theaterShowing.create({
    data: {
      movieId: deadpool.id,
      theaterName: "AMC Universal CityWalk 19",
      theaterAddress: "100 Universal City Plaza, Universal City, CA 91608",
      latitude: 34.1381,
      longitude: -118.3534,
      showtime: new Date("2026-07-26T19:00:00Z"),
      ticketUrl: "https://www.amctheatres.com",
    },
  });

  // ---- Demo watchlist items ----
  await prisma.watchlistItem.upsert({
    where: { userId_seriesId: { userId: user.id, seriesId: loki.id } },
    update: {},
    create: {
      userId: user.id,
      itemType: WatchlistItemType.SERIES,
      seriesId: loki.id,
    },
  });

  await prisma.watchlistItem.upsert({
    where: { userId_movieId: { userId: user.id, movieId: deadpool.id } },
    update: {},
    create: {
      userId: user.id,
      itemType: WatchlistItemType.MOVIE,
      movieId: deadpool.id,
    },
  });

  console.log("✅ Seed complete — demo@example.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
