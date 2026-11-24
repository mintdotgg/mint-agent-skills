---
name: mint-generate
description: Use when the user wants to create, revise, approve, or continue Mint 3D world/model generation through Mint MCP, including prompt generation, image-reference generation, preview review, final approval, and Mint chat handoff.
---

# Mint Generate

Use the Mint MCP tools exposed by the current host.

## Defaults

- Default generation mode is `review` unless the user explicitly asks for automatic final generation.
- Always show the returned `chatUrl` as the main clickable Mint link.
- After waiting for status, show only the Mint handoff link (`chatUrl`). Do not show raw CDN, thumbnail, pano, mesh, preview, asset id, or provider URLs.
- Do not show direct GLB URLs. Tell the user to open `chatUrl` in Mint for the final model.
- Treat orchestration and provider identifiers as internal Mint details. Do not ask for them or expose them.
- Use `get_asset` for polling and recovery after a start tool returns `assetType` and `assetId`.
- Treat `assetId` as the tool handle for follow-up MCP calls. Do not show it to the user unless they ask for raw IDs.
- Do not invent asset IDs, chat IDs, or URLs. Read them from tool outputs.

## Start Generation

For a model:

1. Call `start_model_generation` with `prompt`, `mode: "review"`, and optional `chat_id`.
2. If a reference image is available, pass it as `image_url`.
3. Reply with `chatUrl` and current `status`.

For a world:

1. Call `start_world_generation` with `prompt`, `mode: "review"`, and optional `chat_id`.
2. For one reference image, pass `image_url`.
3. For multiple reference images, pass `source_images`.
4. Reply with `chatUrl` and current `status`.

## Image Inputs

Mint generation tools accept reachable image URLs. Mint MCP itself does not read local paths.

- Public image URL: pass it directly as `image_url` or in `source_images`.
- Local image path: read the file, infer `content_type`, base64 encode the bytes, call `upload_reference_image`, then pass the returned `imageUrl` into the generation tool.
- Inline image attachment with accessible bytes: base64 encode those bytes and call `upload_reference_image`.
- Inline image attachment without accessible bytes or path: ask the user for a local file path or public image URL.
- Supported upload MIME types are `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.

Do not tell the user that the MCP server can read local files. The agent reads local files; MCP receives base64 JSON or public URLs.

## Preview Lifecycle

When a preview is ready:

- To approve: call `approve_final_generation`.
- To revise: call `revise_preview` with `feedback`.
- Prefer `chat_id` plus `target: "latest"` when continuing the current chat.
- Use explicit `asset_type` and `asset_id` when the user names a specific asset.

Approval is the MCP equivalent of clicking the preview approval button in the web UI.

## Polling

If the user asks to wait or check status:

1. Prefer `wait_for_status` with the returned `assetType` and `assetId`.
2. Summarize `status` only when useful.
3. Show `chatUrl` as the clickable Mint handoff link.
4. Do not show raw CDN, thumbnail, pano, mesh, preview, asset id, or provider URLs from tool output.
5. If `terminal` is false, follow `retryGuidance`; do not hold the MCP request open for the full generation.
6. Keep updates short while the asset is still queued or processing.
