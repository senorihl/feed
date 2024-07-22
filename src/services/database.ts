import * as SQLite from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "feeds";

export async function getDatabase() {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
}

export async function removeFeed(feed_url: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE * FROM feed_items WHERE feed_url = ?", feed_url);
  await db.runAsync("DELETE * FROM feeds WHERE url = ?", feed_url);
}

export async function upsertFeed(feed: {
  url: string;
  title: string;
  lastFetch?: Date;
}) {
  const db = await getDatabase();
  try {
    const changedRow = await db.getFirstAsync<{
      url: string;
      title: string;
      last_fetch_at: null | number;
    }>(
      `INSERT INTO feeds (url, title, last_fetch_at) VALUES (?, ?, ?) ON CONFLICT (url) DO UPDATE SET title = excluded.title, last_fetch_at = excluded.last_fetch_at RETURNING *;`,
      feed.url,
      feed.title,
      !feed.lastFetch ? null : Math.floor(feed.lastFetch.getTime() / 1000)
    );

    console.debug("upsertFeed", changedRow);

    return changedRow;
  } catch (e) {
    console.error(e);
  }
}

export async function upsertItem(item: {
  feed_url: string;
  url: string;
  title: string;
  description: null | string;
  updated: null | Date;
  media: null | object;
}) {
  const db = await getDatabase();
  try {
    const changedRow = await db.getFirstAsync<{
      feed_url: string;
      url: string;
      title: string;
      description: string;
      media: string;
      published_at: null | number;
    }>(
      `INSERT INTO feed_items (feed_url, url, title, description, media, published_at) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (feed_url, url) DO UPDATE SET 
      title = excluded.title, 
      description = excluded.description,
      media = excluded.media,
      published_at = excluded.published_at
      RETURNING *;`,
      item.feed_url,
      item.url,
      item.title,
      item.description,
      item.media ? JSON.stringify(item.media) : null,
      !item.updated ? null : Math.floor(item.updated.getTime() / 1000)
    );

    console.debug("upsertItem", changedRow);

    return changedRow;
  } catch (e) {
    console.error(e);
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");
  if (currentDbVersion >= DATABASE_VERSION) {
    console.log("Database is synced");
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
  PRAGMA journal_mode = 'wal';
  CREATE TABLE IF NOT EXISTS feeds (url TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, last_fetch_at INTEGER);
  CREATE TABLE IF NOT EXISTS feed_items (feed_url TEXT NOT NULL, url TEXT NOT NULL, title TEXT NOT NULL, description TEXT, media TEXT, published_at INTEGER, PRIMARY KEY (feed_url, url));
  `);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.log("Database migrated to", DATABASE_VERSION);
}
