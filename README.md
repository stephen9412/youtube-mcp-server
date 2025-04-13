# FastMCP Template

A minimal template for publishing a Fast MCP project. This project provides a lightweight starting point for developing and publishing FastMCP servers.

## Purpose

This template was created as a minimal publishable FastMCP template. Since n8n mcp client and Cherry Studio can only use npx in a stateless manner, many Python MCP servers would benefit from being rewritten in JavaScript for better usability. This template serves as a starting point for such development.

## Features

- Simple and minimal implementation
- Ready to publish
- Stateless design for compatibility with npx
- TypeScript support
- Easy to extend and customize

## Quick Start

> For more detailed usage and advanced features, please visit the [FastMCP GitHub repository](https://github.com/punkpeye/fastmcp).

To develop a new tool for your FastMCP server, follow these steps to modify the `src/server.ts` file:

```ts
# Original file content (starting code)
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
```

Now, let's add a new tool! For example, you can add a random number generator tool:

```diff
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

+ // Add a new random number generator tool
+ server.addTool({
+   name: "random",
+   description: "Generate a random number between min and max (inclusive)",
+   parameters: z.object({
+     min: z.number().default(0),
+     max: z.number().default(100),
+   }),
+   execute: async (args) => {
+     const min = Math.ceil(args.min);
+     const max = Math.floor(args.max);
+     const result = Math.floor(Math.random() * (max - min + 1)) + min;
+     return String(result);
+   },
+ });

server.start({
  transportType: "stdio",
});
```

For more comprehensive examples and advanced usage patterns, refer to the [FastMCP documentation](https://github.com/punkpeye/fastmcp).

## Running Your Server

### Development

```bash
npm run dev
```

### Inspection

```bash
npm run inspect
```

### Production

```bash
npm run start
```

## How to use with Claude Desktop?

### Using the Published Package (Stateless Execution)

After publishing to npm, you can use the package in a stateless manner with npx:

```json
{
  "mcpServers": {
    "fastmcp-template": {
      "command": "npx",
      "args": [
        "fastmcp-template"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Using a Local Development Version

For local development or custom versions:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": [
        "tsx",
        "/PATH/TO/YOUR_PROJECT/src/server.ts"
      ],
      "env": {
        "YOUR_ENV_VAR": "value"
      }
    }
  }
}
```

### Using from a Custom Registry

If you're using a private npm registry:

```json
{
  "mcpServers": {
    "fastmcp-template": {
      "command": "npx",
      "args": [
        "--registry=https://your-private-registry.com",
        "fastmcp-template"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Issues and Contributions

If you encounter any issues or would like to contribute to this project, please visit our [GitHub repository](https://github.com/stephen9412/fastmcp-template).

- Report issues: [https://github.com/stephen9412/fastmcp-template/issues]
- Submit contributions: Create a pull request on our GitHub repository

## License

MIT
