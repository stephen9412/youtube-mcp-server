import dotenv from 'dotenv';
import { FastMCP } from "fastmcp";

import { registerChannelTools } from "./channel.js";
import { registerVideoTools } from "./video.js";
import { registerPlaylistTools } from "./playlist.js";

dotenv.config();

const server = new FastMCP({
  name: "YouTube MCP Stateless API",
  version: "0.1.0",
});

// 註冊三大領域工具
registerChannelTools(server);
registerVideoTools(server);
registerPlaylistTools(server);

server.start({
  transportType: "stdio",
});
