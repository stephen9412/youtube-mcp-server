import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { google } from "googleapis";

function getYoutube() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new UserError("YOUTUBE_API_KEY environment variable is not set.");
  return google.youtube({ version: "v3", auth: apiKey });
}

export function registerChannelTools(server: FastMCP) {
  // describeChannel
  server.addTool({
    name: "describeChannel",
    description: "Get public channel information (title, description, custom URL, subscriber count, statistics, etc.)",
    parameters: z.object({
      channelId: z.string(),
    }),
    execute: async ({ channelId }) => {
      const youtube = getYoutube();
      const response = await youtube.channels.list({
        part: ["snippet", "statistics", "contentDetails"],
        id: [channelId],
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new UserError("Channel not found");
      }
      return JSON.stringify(response.data.items[0]);
    },
  });
}