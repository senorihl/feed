import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { parseFeed, Parser } from "htmlparser2";
import type { FeedItemMedia } from "domutils/lib/feeds";
import { upsertFeed, upsertItem } from "../../services/database";

type Feed = {
  url: string;
  updated: string;
  lastFetch: string;
  title: string;
  description?: string;
  items: Array<{
    title: string;
    link: string;
    description: string;
    updated: string;
    media?: FeedItemMedia;
  }>;
};

const baseQueryOpts = {
  baseUrl: "https://us-central1-lobs-159411.cloudfunctions.net",
};

const resToFeed = (res: string, metas, url: string) => {
  const feed = parseFeed(res);
  const lastFetch = new Date();

  if (!feed) {
    throw `Invalid feed given in <${url}>`;
  }

  const transformed = {
    url,
    lastFetch: lastFetch.toJSON(),
    title: feed?.title || url,
    description: feed?.description,
    updated: feed.updated?.toJSON() || new Date().toJSON(),
    items: feed.items.map((val) => {
      const medias = val.media.filter(
        (val) => val.medium === "image" || !val.medium
      );
      return {
        title: val.title,
        description: val.description,
        link: val.link,
        updated: val.pubDate?.toJSON(),
        media: medias.length > 0 ? medias[0] : void 0,
      };
    }),
  };

  (async (feed: typeof transformed) => {
    await upsertFeed({
      url: feed.url,
      title: feed.title,
      lastFetch: new Date(feed.lastFetch),
    });
    for (let i = 0; i < feed.items.length; i++) {
      const item = feed.items[i];
      await upsertItem({
        feed_url: url,
        url: item.link,
        title: item.title,
        description: item.description,
        updated: item.updated ? new Date(item.updated) : null,
        media: item.media || null,
      });
    }
  })(transformed);

  return transformed;
};

export const feedApi = createApi({
  reducerPath: "feeds",
  baseQuery: fetchBaseQuery(baseQueryOpts),
  endpoints: (builder) => ({
    getOPML: builder.query<Array<Feed>, string>({
      query: (xmlUrl) => ({
        url: "/cors-anywhere",
        params: { u: xmlUrl },
        responseHandler: "text",
      }),
      transformResponse(res: string) {
        return new Promise<Array<Feed>>((resolve, reject) => {
          let isOpml = false;
          const feeds: Array<Promise<ReturnType<typeof resToFeed>>> = [];
          const parser = new Parser({
            onopentag(name, attribs, isImplied) {
              if (name === "opml") isOpml = true;
              if (
                isOpml &&
                name === "outline" &&
                typeof attribs["xmlurl"] === "string" &&
                typeof attribs["type"] === "string" &&
                attribs["type"] === "rss"
              ) {
                feeds.push(
                  fetch(
                    baseQueryOpts.baseUrl +
                      "/cors-anywhere?u=" +
                      encodeURIComponent(attribs["xmlurl"])
                  )
                    .then((res) => res.text())
                    .then((res) => resToFeed(res, null, attribs["xmlurl"]))
                );
              }
            },
            onend() {
              Promise.allSettled(feeds).then((feeds) =>
                resolve(
                  feeds
                    .filter(({ status }) => status === "fulfilled")
                    .map(({ value }) => value)
                )
              );
            },
            onerror(error) {
              reject(error);
            },
          });

          parser.write(res);
          parser.end();
        });
      },
    }),
    getFeed: builder.query<Feed, string>({
      query: (feedUrl) => ({
        url: "/cors-anywhere",
        params: { u: feedUrl },
        responseHandler: "text",
      }),
      async onQueryStarted(arg, api) {
        try {
          const feed = await api.queryFulfilled;
          api.dispatch(
            (await import("./configuration")).updateFeedFetchDate([
              arg,
              feed.data.lastFetch,
            ])
          );
        } catch (e) {
          console.debug(e);
        }
      },
      transformResponse: resToFeed,
    }),
  }),
});

export const { useGetFeedQuery, useLazyGetFeedQuery } = feedApi;
