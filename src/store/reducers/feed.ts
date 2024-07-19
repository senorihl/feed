import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { parseFeed } from "htmlparser2";
import type { FeedItemMedia } from "domutils/lib/feeds";
import { updateFeedFetchDate } from "./configuration";

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

export const feedApi = createApi({
  reducerPath: "feeds",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://us-central1-lobs-159411.cloudfunctions.net",
  }),
  endpoints: (builder) => ({
    getFeed: builder.query<Feed, string>({
      query: (feedUrl) => ({
        url: "/cors-anywhere",
        params: { u: feedUrl },
        responseHandler: "text",
      }),
      async onQueryStarted(arg, api) {
        try {
          const feed = await api.queryFulfilled;
          api.dispatch(updateFeedFetchDate([arg, feed.data.lastFetch]));
        } catch (e) {
          console.debug(e);
        }
      },
      transformResponse(res: string, metas, url) {
        const feed = parseFeed(res);

        if (!feed) {
          throw `Invalid feed given in <${url}>`;
        }

        return {
          url,
          lastFetch: new Date().toJSON(),
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
      },
    }),
  }),
});

export const { useGetFeedQuery, useLazyGetFeedQuery } = feedApi;
