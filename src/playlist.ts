import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { google } from "googleapis";

function getYoutube() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new UserError("YOUTUBE_API_KEY environment variable is not set.");
  return google.youtube({ version: "v3", auth: apiKey });
}

export function registerPlaylistTools(server: FastMCP) {
  // describePlaylist
  server.addTool({
    name: "describePlaylist",
    description: "Get public playlist information (title, description, video list)",
    parameters: z.object({
      playlistId: z.string(),
    }),
    execute: async ({ playlistId }) => {
      const youtube = getYoutube();
      const response = await youtube.playlistItems.list({
        part: ["snippet"],
        playlistId,
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new UserError("Playlist not found");
      }
      return JSON.stringify(response.data.items);
    },
  });

  // managePlaylistItems
  server.addTool({
    name: "managePlaylistItems",
    description: "Playlist content management (add/remove/reorder)",
    parameters: z.object({
      action: z.enum(["add", "remove", "reorder"]),
      playlistId: z.string(),
      videoId: z.string().optional(),
      itemId: z.string().optional(),
      position: z.number().optional(),
    }),
    execute: async ({ action, playlistId, videoId, itemId, position }) => {
      const youtube = getYoutube();
      let result;
      switch (action) {
        case "add":
          if (!videoId) throw new UserError("videoId is required for add action");
          result = await youtube.playlistItems.insert({
            part: ["snippet"],
            requestBody: {
              snippet: {
                playlistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId,
                },
              },
            },
          });
          break;
        case "remove":
          if (!itemId) throw new UserError("itemId is required for remove action");
          result = await youtube.playlistItems.delete({
            id: itemId,
          });
          break;
        case "reorder":
          if (!itemId || !videoId || typeof position !== "number") {
            throw new UserError("itemId, videoId, and position are required for reorder action");
          }
          result = await youtube.playlistItems.update({
            part: ["snippet"],
            requestBody: {
              id: itemId,
              snippet: {
                playlistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId,
                },
                position,
              },
            },
          });
          break;
        default:
          throw new UserError("Unknown action");
      }
      return JSON.stringify(result.data || {});
    },
  });
}