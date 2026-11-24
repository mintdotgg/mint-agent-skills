---
name: mint-read
description: Use when the user wants to inspect Mint account state, credits, context, owned assets, Images, audio assets, asset status, preview images, artifact availability, or Mint chat handoff links through Mint MCP without starting generation.
---

# Mint Read

Use the Mint MCP tools exposed by the current host. Prefer read tools unless the user explicitly asks to create, revise, or approve generation.

## Tools

- `open_mint`: open Mint's interactive Home when the user asks to open Mint or the Mint plugin. Chat launches prefer inline display and provide Expand for the full library. Sidebar launching remains available. The UI also has Explore for featured public models, worlds, packs, materials, and starter Projects. Public Add to chat selections are references, not owned assets; Use project explicitly copies a starter into the connected account. This is a read-only action and does not start generation or spend credits. Use the host's opener result instead of returning a website link as a substitute.
- `who_am_i`: confirm the authenticated Mint user identity, scopes, scope-backed asset-pipeline capabilities, preflight readiness, subscription summary, and compact credit summary.
- `get_credits_balance`: read included monthly Credits, Usage Credits, completion reserves, and billing blockers.
- `get_mint_context`: get a bounded account/context snapshot including the active Project and recent Projects.
- `get_modeler_operation`: read an owned Modeler operation's stage, recent public progress, session link, model resource, and Credit settlement using `operation_id`. Follow `pollIntervalMs`; a delivered GLB can be available while billing is pending. Final file URLs require the artifact tools and their download scope.
- `list_projects`: browse active Projects, or include archived Projects when needed.
- `list_my_assets`: browse owned worlds, models, asset packs, materials, Images, and audio assets. Omit `project_id` for All Assets or pass a Project ID to scope the result.
- `get_asset`: fetch one owned asset by `asset_type` and `asset_id`.
- `open_model`: inspect an owned final model in Mint's interactive 3D viewer inside Codex without generation or credit spend. For an Asset Pack item, pass its `model_id` and the owning `asset_pack_id` to retain pack access checks. This uses the existing artifact access scope; reconnect the current server if it is missing.
- `open_world`: inspect an owned, processed world in Mint's streamed Gaussian splat viewer inside Codex without generation or credit spend.
- Mint's file entrypoint opens self-contained `.glb`, `.ply` (Gaussian splats), `.spz`, `.splat`, `.ksplat`, `.sog`, and `.rad` files through Codex's host resource bridge, up to 100 MB. It does not send local file contents to the remote Mint server. SOG and RAD files requiring external sidecars are not supported.
- Mint Home opens Projects and Asset Packs as collections of models. Opening a collection or viewer does not attach context; the user can choose Add to chat. Project starters remain editable until Send to chat, which attaches that Project and sends the completed prompt.
- `wait_for_status`: briefly poll an owned world, model, asset pack, material, Image, or audio asset.
- `wait_for_many`: briefly poll 1-25 existing owned asset handles with one bounded timeout while preserving per-asset success, failure, and retry state.
- `list_asset_artifacts`: list downloadable artifact descriptors with stable IDs, semantic roles, and trustworthy known media metadata for a model, asset pack, material, Image, or audio asset without returning download URLs.
- `list_model_animation_sets`: discover versioned curated animation bundles with stable IDs, semantic clip roles, previews, and companion-asset assembly metadata.
- `list_model_animation_options`: browse the Meshy animation catalog without starting animation.
- `get_model_animation`: read normalized status for an animation batch or clip.
- `wait_for_model_animation`: briefly poll an animation batch or clip.
- `list_model_animation_artifacts`: list stable rigged-character and animation-clip artifact IDs and semantic roles without returning download URLs.

Prefer `list_model_animation_sets` for common bundles such as locomotion,
combat, seated NPC, social behavior, and prop interactions. Pass the returned
stable set `id` to `animate_generated_model` as `animation_set_id`; do not
guess set IDs from user wording.

`list_model_animation_options` is ranked for safe custom selection. Generic walk
queries should surface neutral walk cycles first; use style-specific presets
such as "Walking Woman" only when the user's query explicitly asks for that
style or character type.

## Preflight And Authorization

- Before the first billable multi-asset workflow, call `who_am_i` once.
- Continue only when `preflight.readyForAssetPipeline` is true. Otherwise show
  the connected server's `recommendedAction` and stop before spend.
- Do not probe, discover, or suggest another Mint environment as an auth
  workaround. Reconnect the current Mint MCP server.
- Treat generation options as supported only when the live MCP tool schema
  exposes them. Do not infer controls from an underlying provider.

## Asset Status

Use the asset's own `status` field as the lifecycle signal.

- `preview_ready`: a review-mode preview is ready; final generation still needs approval.
- `processing` or `queued`: generation is still running.
- `succeeded` or `partially_succeeded`: final output may be available. Use `list_asset_artifacts` to check downloadable files.
- `failed`: summarize the safe `failureReason` and `retryGuidance`. Never expose moderation categories, model reasoning, provider errors, `workflowStageLastError`, stack traces, or internal paths. Treat only `retryable: true` as safe to retry unchanged; an unavailable safety check is retryable, while a completed policy block requires changed content. Quota and invalid input must be resolved first.
- `cancelled`: summarize the state and avoid retrying unless the user asks.

Do not expose Trigger run IDs, provider job IDs, or provider-specific status names. Those are internal implementation details.

For animation, use the dedicated `target_type` plus `target_id` shape. Valid
target types are `asset_pack_animation_batch`, `model_animation_batch`, and
`model_animation_clip`. Do not call `get_asset(asset_type: "model")` with an
animation batch or clip ID.

## URLs

- Show `chatUrl` when available so the user can open generation results and status in Mint.
- For generated assets, prefer only the Mint handoff link and inline preview images when useful. Do not show raw CDN, thumbnail, pano, mesh, material map, audio file, preview, asset id, storage key, provider, or Trigger URLs from normal read/status tools.
- `get_asset` and `wait_for_status` may include `nextSteps`; use them to continue to artifact tools when the user needs files in a code project. Use `wait_for_many` when two or more existing asset handles need the same bounded wait.
- If the user needs to inspect available files, call `list_asset_artifacts`. If they ask to download/fetch/import files into a code project, switch to `mint-generate` and use `get_asset_artifact_manifest`; use `get_asset_artifact` only for one selected file.
- If the user needs animation file availability, call `list_model_animation_artifacts`. If they ask to download/fetch/import animation files into a code project, switch to `mint-generate` and use `get_model_animation_artifact_manifest`; use `get_model_animation_artifact` only for one selected file.
- If a URL is missing, say which status you saw instead of guessing.

## Credits

- Treat `credits.totalAvailable` as the user's usable credit total when present.
- Also show the components when relevant: `credits.monthlyRemaining` from subscription allowance, `credits.usageCredits` from non-expiring Usage Credits, and `credits.reservedForCompletion` for protected final-generation balance.

## Boundaries

- Do not call `start_model_generation`, `start_world_generation`, `retry_generation`, `start_asset_pack_generation`, `start_material_generation`, `start_material_pack_generation`, `start_image_generation`, `start_image_edit`, `start_audio_generation`, lifecycle derivative tools, approval tools, `get_asset_artifact_manifest`, `get_model_animation_artifact_manifest`, `get_asset_artifact`, or `upload_reference_image` unless the user explicitly asks for a generation, retry, Image edit, post-processing, approval, upload, import, or download action.
- `wait_for_status.timeout_ms`, `wait_for_many.timeout_ms`, and `wait_for_model_animation.timeout_ms` are capped at `60000`; use repeated short waits.
- If the user asks to approve or revise a preview, switch to `mint-generate`.

Video assets use `asset_type: "video"` for account reads, bounded waits, and artifact tools. A finished clip is `video_file`; its manifest has a durable URL, `loaderHint: "video"`, and a suggested path under `public/videos/`.

Existing non-Modeler `chatUrl` values open generation results and status. They do not open a Spatial chat transcript or composer. Modeler `sessionUrl` opens its separate modeling conversation on mint.gg.
