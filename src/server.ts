#!/usr/bin/env node
import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
  name: "FastMCP Minimal implementation",
  version: "0.0.1",
});

server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async (args) => {
    if (false) {
      throw new UserError("Error Message.");
    }

    return String(args.a + args.b);
  },
});

server.start({
  transportType: "stdio",
});
