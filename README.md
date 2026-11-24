# Mint Plugin

Current Web interface: Modeler chat, Account, subscriptions, and Library. Non-Modeler `chatUrl` links open an owner-scoped results/status page without a Spatial transcript or composer. Keep existing chat IDs as machine lifecycle targets; Modeler conversation IDs are separate.

The Mint MCP server lets AI agents use Mint as an asset pipeline layer: organize work in Projects, read account and asset state, start Modeler/world/model/asset-pack/material/Image/audio generation, edit generated Images, upload reference images, continue preview approval flows, run post-processing, fetch downloadable artifacts, and retrieve remote RAD runtime manifests for worlds.

This package bundles:

- MCP server metadata and client config for `https://mcp.mint.gg/mcp`
- Two shared agent skills:
  - `mint-generate` for creation, reference images, revision, approval, derivative actions, artifact download, and chat handoff
  - `mint-read` for account, credits, assets, statuses, artifact listings, and Mint links
- A portable Agent Plugins manifest for ChatGPT and Codex
- Mint icons and five positive / three negative review scenarios
- Compatibility metadata for Codex, Cursor, and Claude Code in the source package

## ChatGPT and Codex

The portable plugin uses `plugin.json` for identity and listing metadata,
`mcp.json` for the production remote MCP connection, `skills/` for workflows,
and `assets/` for icons. Sign in to Mint when the host prompts for OAuth.
Modeler requires an active Mint account and sufficient Credits. Other
generation tools can have additional plan requirements.

For local installation, add the package folder to a repo or personal
marketplace, restart the desktop app, choose that marketplace in the Plugins
Directory, and install Mint. Start a new chat to use its skills and tools.
See OpenAI's [plugin packaging guide](https://developers.openai.com/plugins/build/plugins)
for the supported marketplace layout.

The MCP server also registers Mint Home as a sidebar app. Browse owned Projects
in a thumbnail grid, filter active or archived Projects, and use category tabs
for models, worlds, asset packs, materials, material packs, images, video, and
audio. Creating or opening a Project shows its models and editable prompt
starters. Opening an Asset Pack shows its individual models, including items
still being generated. Choose a ready model to inspect it. Browsing does not
attach chat context; choose **Add to chat** in a collection or viewer to do that.
A completed Project starter sends to chat only when you choose **Send to chat**.
Account and credits stay in the Home header.

Choose **Explore** beside Home to browse the same featured 3D models, worlds,
asset packs, materials, and starter Projects as mint.gg. Public assets open in
Mint's native viewers; asset packs show their public models. **Add to chat**
attaches a public reference separately. **Use project** copies a featured
starter into your connected account and opens your copy when ready. Progress,
Check again, and Retry copy keep the same copy request. Browsing and previewing
do not start generation or spend credits.

Video and audio cards open players with playback controls. Image cards open a
full-size preview with zoom and pan. Materials open a tiled PBR sphere with
individual map inspection, and Material Packs open their member materials.
These previews keep ownership and download permissions; **Add to chat** remains
a separate action.

Click a model card to open the interactive 3D viewer inside Codex. Drag to orbit,
scroll to zoom, reset the view, enable rotation, or switch inspection modes.
After final model generation, the agent calls `open_model` to show the same
viewer. Click a ready world to inspect its streamed Gaussian splat with
`open_world`. In a world or local splat viewer, click the canvas and use WASD or
arrow keys to fly, drag to look, Space to move up, and Shift to move down.
Scroll moves forward/backward while focused; Escape releases keyboard controls.
Viewing does not start generation or spend credits. Owned models
retain their artifact access checks, including Asset Pack membership checks.

The viewer also registers as Codex's handler for self-contained `.glb`, `.ply`
(Gaussian splats), `.spz`, `.splat`, `.ksplat`, `.sog`, and `.rad` files up to
100 MB. It reads local files through the host resource bridge without uploading
them to Mint. SOG/RAD files requiring sidecars and polygon-mesh PLY files are
not supported. GLB inspection modes apply to models; splats use their own
renderer. The info panel shows file details and viewer controls.

Sidebar discovery comes from the server's `open_mint` tool and MCP App resource.
Asking to open Mint in chat prefers an inline view; use Expand to open the full
view. Sidebar and file entrypoints open in the host's full view.
The server must include that registration for Mint to appear in the sidebar's
pin menu; installing or copying this package alone does not add a navigation
entry. Refresh the host's tool discovery after the server is updated.

For public distribution, first complete listing and publication details, run
the packaged review scenarios with a dedicated reviewer account, and record
and host a reviewer-accessible demo. The packaged scenarios describe expected
behaviors; they are not completed test results. Once those materials are ready,
upload the portable ZIP to the
[OpenAI Plugins dashboard](https://platform.openai.com/plugins), connect
`https://mcp.mint.gg/mcp` using OAuth, complete domain verification, and test the
saved version. Supply reviewer access through the secure dashboard fields before
submitting. See the
[submission guide](https://developers.openai.com/plugins/deploy/submission).

The portable ZIP contains the root manifest, portable MCP configuration,
README, shared skills, and icons. The source package additionally retains the
host compatibility manifests and `.mcp.json`.

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
npx https://github.com/mintdotgg/mint-agent-skills/releases/download/v0.1.1/mintgg-setup-0.1.1.tgz
```

Append `--agent cursor` or `--agent claude-code` to target either client.

Setup targets Codex by default. Each command installs both skills and adds
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
npx --package=/absolute/path/to/mintgg-setup-0.1.1.tgz -- mint-setup
```

## MCP Server

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "mint": {
      "type": "streamable-http",
      "url": "https://mcp.mint.gg/mcp"
    }
  }
}
```

## Skills

Use `mint-generate` when the user wants to create or change Mint output:

- start model, world, asset-pack, material, Image, or audio generation
- edit an owned finished Image as an immutable derivative
- upload local image bytes to Mint CDN
- revise a preview
- approve final generation
- regenerate failed final asset-pack items after partial completion
- optimize, retopologize, or animate existing generated models
- retrieve durable artifact download URLs
- wait on animation batches/clips and retrieve animation artifacts
- continue generation through a Mint chat

Use `mint-read` when the user wants to inspect Mint state:

- identity and credits
- active and recent Project context
- Project listing and Project-scoped asset browsing
- owned worlds, models, asset packs, materials, Images, and audio assets
- asset status, preview images, and Mint chat handoff links
- artifact descriptors without direct download URLs
- animation batch/clip status and animation artifact descriptors

## Agent Workflow

The default coding-agent flow is:

1. Before the first billable multi-asset workflow, call `who_am_i` once. Proceed
   only when `preflight.readyForAssetPipeline` is true; otherwise follow its
   reconnect guidance for the connected Mint MCP server and stop before spend.
2. For chat-based generation, select an existing Project with `list_projects`, or create one when the user asks. Pass `project_id` to a start tool whenever `chat_id` is absent. Modeler uses an account-owned Modeler session instead.
3. Start or find an asset.
   Prefer discrete models or asset packs for scene composition. Start a world
   only when the user explicitly requests a Mint-generated environment or
   approves that environment-level choice.
4. Let start and revision tools use their default `auto` mode unless the user explicitly asks to inspect, revise, select, or approve previews first.
5. Use returned `nextSteps` when present; for one code-project asset, that means `wait_for_status`, then `get_asset_artifact_manifest`. For 2-25 existing asset handles, use `wait_for_many`, then `get_asset_artifact_manifests`, preserving per-asset failures instead of restarting successful work. Use `list_asset_artifacts` plus `get_asset_artifact` for one selected file.
6. For `wait_for_status` or `wait_for_many`, omit `timeout_ms` to use the
   `30000` default. When supplied, it must be `<= 60000`; use repeated short
   waits instead of inventing a longer timeout.
7. Approve or revise previews when review mode is explicitly used.
   Once a model reaches final output, call `open_model` with its model ID to
   present it inside Codex. Keep the Mint chat link as the fallback when the host
   cannot display MCP Apps.
8. If an asset pack partially succeeds, inspect item status and regenerate failed final items.
9. Run derivative actions such as optimize, retopologize, or animate only on succeeded assets.
10. For animation, call `get_model_animation` or `wait_for_model_animation` with the returned batch/clip target.
11. For code-project imports, fetch manifests: `get_asset_artifact_manifest` for one world/model/asset-pack/material/Image/audio output, `get_asset_artifact_manifests` for 2-25 existing assets, or `get_model_animation_artifact_manifest` for rigged/animation files. World manifests are remote SparkJS RAD runtime contracts rather than downloads.
    Use each stable `artifactId` and semantic `role` when recording project assets. Preserve actual Image dimensions/aspect ratio and audio duration when present; do not infer omitted metadata.
12. For one selected file, list artifacts before downloading: `list_asset_artifacts` plus `get_asset_artifact`, or `list_model_animation_artifacts` plus `get_model_animation_artifact`.
13. Fetch runtime URLs only through explicit manifest/artifact tools, using
    `mintUrl` for the Mint handoff, `downloadUrl` for files, and the world
    `runtimeUrl` directly with SparkJS. World manifests also include a
    stabilized collider GLB that stays invisible and supplies physics.

Use only generation controls exposed by the live Mint MCP schema. Do not infer
resolution, aspect-ratio, transparency, or other controls from the underlying
provider, and do not probe another Mint environment as an auth workaround.

### Modeler

Use `start_modeler_generation` for Modeler's static GLB workflow. Supply the
user's chosen `quality_tier`, explicit `max_credits`, and a unique `request_id`.
Reuse that ID with identical input after a lost response. Low (the default)
reserves 2,000 Credits, Medium 8,000, High 25,000, Max 100,000, and Ultra 625,000; the cap must
cover the tier price. Actual usage is charged up to that price.

Poll `get_modeler_operation`, then use `get_asset_artifact_manifest` with
`asset_type: "model"` and `resource.id` after success. Continue polling until
`modeler.billingState` is `settled`; delivery can finish before billing.
`revise_modeler_model` creates a new model and preserves the original.
`cancel_modeler_operation` stops owned work but may charge incurred usage.
Modeler needs no API key, Mint chat, or Project ID and has no Preview approval.
Use an active Mint account and sufficient Credits.
It does not support rigging, animation, or uploaded-model editing. Use
`start_model_generation` for the separate preset/Preview workflow.

Normal read/status tools intentionally omit final GLB, material map, Image, audio,
provider, storage, Trigger, and raw animation GLB/FBX URLs.

Worlds are not listed or downloaded through `list_asset_artifacts`. After RAD
post-processing succeeds, `get_asset_artifact_manifest` returns the remote
Mint CDN URL and SparkJS loader contract.

## Host Plugins

The portable `plugin.json` and `mcp.json` are the primary ChatGPT and Codex
entry points. The source package also retains compatibility metadata pointing
at the same shared `skills/` directory and `.mcp.json` config:

- `.codex-plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.claude-plugin/plugin.json`

Each host has different installation mechanics, but the behavioral contract should stay the same: use the native Mint MCP provider, use the Mint skills for generation guidance, render returned `previewImageUrl` values inline when useful, show returned `chatUrl` values as the Mint handoff link, follow `nextSteps` when present, and use explicit artifact tools when files need to be fetched into a code project.

### Codex

Codex uses the root `plugin.json` and its `extensions.com.openai` listing
metadata, discovers `skills/`, and loads the production server from `mcp.json`.
The `.codex-plugin/plugin.json` compatibility manifest points older clients at:

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
