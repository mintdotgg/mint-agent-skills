# Mint MCP Plugin Package

The Mint MCP server lets AI agents read Mint account and asset state, start 3D world/model generation, upload reference images to Mint CDN, and continue preview approval flows.

This package bundles:

- MCP server metadata and client config for `https://mcp.mint.gg/mcp`
- Two shared agent skills:
  - `mint-generate` for creation, reference images, revision, approval, and chat handoff
  - `mint-read` for account, credits, assets, statuses, and URLs
- Plugin metadata for Codex, Cursor, and Claude Code

## Install in your project

From your project root, run the command for your client once the installer is
published to the npm registry:

```sh
npx @mintgg/setup
npx @mintgg/setup --agent cursor
npx @mintgg/setup --agent claude-code
```

You can also run the versioned package from GitHub Releases:

```sh
npx --package=https://github.com/mintdotgg/mint-agent-skills/releases/download/v0.1.0/mintgg-setup-0.1.0.tgz -- mint-setup
```

Append `--agent cursor` or `--agent claude-code` to target either client.

The first command targets Codex. Each command installs both skills and adds
the production `mint` MCP server to your client's project configuration.
You can rerun setup safely. If a Mint skill or server entry conflicts with the
bundled version, setup stops and tells you which file to review.

Open or restart the client in the project, approve the project or server if
prompted, and sign in to Mint when the client opens the authorization screen.

To install just the skills, use the Skills CLI:

```sh
npx skills add mintdotgg/mint-agent-skills
```

To test the installer before publishing, run `pnpm pack` in this package
directory and then run the packed installer from a test project:

```sh
npx --package=/absolute/path/to/mintgg-setup-0.1.0.tgz -- mint-setup
```

## MCP Server

```json
{
  "mcpServers": {
    "mint": {
      "type": "http",
      "url": "https://mcp.mint.gg/mcp"
    }
  }
}
```

## Skills

Use `mint-generate` when the user wants to create or change Mint output:

- start model or world generation
- upload local image bytes to Mint CDN
- revise a preview
- approve final generation
- continue generation through a Mint chat

Use `mint-read` when the user wants to inspect Mint state:

- identity and credits
- recent context
- owned worlds, models, and Studio projects
- asset status, preview images, and Mint chat handoff links

## Host Plugins

The plugin metadata folders point at the same shared `skills/` directory and `.mcp.json` config:

- `.codex-plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.claude-plugin/plugin.json`

Each host has different installation mechanics, but the behavioral contract should stay the same: use the native Mint MCP provider, use the Mint skills for generation guidance, render returned `previewImageUrl` values inline when useful, and show returned `chatUrl` values as the Mint handoff link.

### Codex

The Codex plugin manifest is `.codex-plugin/plugin.json`. It points Codex at:

- `skills/` for `mint-generate` and `mint-read`
- `.mcp.json` for the Mint remote MCP server

Codex-specific guidance belongs in the skills only when it is stable host behavior. Do not include local debugging workarounds in public skill text.

### Cursor

The Cursor plugin manifest is `.cursor-plugin/plugin.json`. It points Cursor at:

- `skills/` for shared generation instructions
- `.mcp.json` for the Mint remote MCP server

It also carries the hosted Mint icon URL. Cursor may still show a generic icon
for manually configured workspace/user MCP servers; official entries in Cursor's
curated MCP server list can carry provider branding independently of local
`mcp.json` entries.

### Claude Code

The Claude Code plugin manifest is `.claude-plugin/plugin.json`. The package root also contains:

- `skills/` for shared generation instructions
- `.mcp.json` for the Mint remote MCP server
