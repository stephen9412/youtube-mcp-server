import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { google } from "googleapis";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";

function getYoutube() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new UserError("YOUTUBE_API_KEY environment variable is not set.");
  return google.youtube({ version: "v3", auth: apiKey });
}

export function registerVideoTools(server: FastMCP) {
  // describeVideo
  server.addTool({
    name: "describeVideo",
    description: "Get video information (selectable sections)",
    parameters: z.object({
      videoId: z.string(),
      sections: z.array(z.enum(["basic", "technical", "metrics", "restrictions"])).optional(),
    }),
    execute: async ({ videoId, sections }) => {
      const youtube = getYoutube();
      const partMapping: Record<string, string> = {
        basic: "snippet",
        technical: "contentDetails",
        metrics: "statistics",
        restrictions: "status",
      };
      const parts = (sections && sections.length > 0)
        ? sections.map(s => partMapping[s])
        : ["snippet"];
      const response = await youtube.videos.list({
        part: parts,
        id: [videoId],
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new UserError("Video not found");
      }
      return JSON.stringify(response.data.items[0]);
    },
  });

  // getDownloadOptions
  server.addTool({
    name: "getDownloadOptions",
    description: "Get available download formats/qualities for a video",
    parameters: z.object({
      videoId: z.string(),
    }),
    execute: async ({ videoId }) => {
      const info = await ytdl.getInfo(videoId);
      const formats = info.formats.map(f => ({
        itag: f.itag,
        type: f.mimeType,
        quality: f.qualityLabel,
        hasAudio: !!f.audioBitrate,
      }));
      return JSON.stringify(formats);
    },
  });

  // downloadVideo
  server.addTool({
    name: "downloadVideo",
    description: "Download video/audio stream",
    parameters: z.object({
      videoId: z.string(),
      options: z.object({
        format: z.enum(["mp4", "webm"]).optional(),
        quality: z.enum(["highest", "lowest"]).optional(),
        filename: z.string().optional(),
      }).optional(),
    }),
    execute: async ({ videoId, options }) => {
      const PREDEFINED_FOLDER = process.env.DOWNLOAD_BASE_DIR || "./downloads";
      if (!fs.existsSync(PREDEFINED_FOLDER)) {
        fs.mkdirSync(PREDEFINED_FOLDER, { recursive: true });
      }
      const format = options?.format || "mp4";
      const quality = options?.quality || "highest";
      const filename = options?.filename || `${videoId}.${format}`;
      const outputPath = path.join(PREDEFINED_FOLDER, filename);

      return new Promise((resolve, reject) => {
        try {
          const writeStream = fs.createWriteStream(outputPath);
          const videoStream = ytdl(videoId, {
            quality,
            filter: (f) => format ? f.container === format : true,
          });
          videoStream
            .pipe(writeStream)
            .on("finish", () => resolve(JSON.stringify({
              success: true,
              filePath: outputPath,
            })))
            .on("error", (err) => reject(new UserError("Download failed: " + err.message)));
        } catch (err: any) {
          reject(new UserError("Download failed: " + err.message));
        }
      });
    },
  });

  // extractThumbnail
  server.addTool({
    name: "extractThumbnail",
    description: "Extract and process video thumbnail",
    parameters: z.object({
      videoId: z.string(),
      size: z.enum(["max", "medium", "default"]).optional(),
    }),
    execute: async ({ videoId, size }) => {
      const info = await ytdl.getInfo(videoId);
      const thumbnails = info.videoDetails.thumbnails;
      let thumbnailUrl = thumbnails[0].url;
      if (size === "max") {
        thumbnailUrl = thumbnails.sort((a, b) => b.width - a.width)[0].url;
      } else if (size === "medium") {
        thumbnailUrl = thumbnails.sort((a, b) => a.width - b.width)[Math.floor(thumbnails.length / 2)].url;
      }
      const Jimp = await import("jimp");
      const image = await (Jimp as any).read(thumbnailUrl);
      const buffer = await image
        .resize(800, (Jimp as any).AUTO)
        .quality(85)
        .getBufferAsync((Jimp as any).MIME_JPEG);
      const base64 = buffer.toString("base64");
      return base64;
    },
  });

  // listSubtitleLanguages
  server.addTool({
    name: "listSubtitleLanguages",
    description: "Get available subtitle languages for a video",
    parameters: z.object({
      videoId: z.string(),
    }),
    execute: async ({ videoId }) => {
      const info = await ytdl.getInfo(videoId);
      const tracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const langs = tracks.map((t: any) => t.languageCode);
      return JSON.stringify(langs);
    },
  });

  // manageVideoStatus
  server.addTool({
    name: "manageVideoStatus",
    description: "Manage video privacy status (public/private/unlisted)",
    parameters: z.object({
      videoId: z.string(),
      status: z.enum(["public", "private", "unlisted"]),
    }),
    execute: async ({ videoId, status }) => {
      const youtube = getYoutube();
      const result = await youtube.videos.update({
        part: ["status"],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: status,
            license: "youtube",
            embeddable: true,
          },
        },
      });
      return JSON.stringify(result.data || {});
    },
  });
}