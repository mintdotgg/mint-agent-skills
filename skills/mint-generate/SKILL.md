---
name: mint-generate
description: Use when the user wants to create, edit, revise, approve, post-process, animate, or fetch Mint assets through Mint MCP, including Modeler, Images, models, worlds, asset packs, materials, audio, video, preview review, final approval, artifact download, and Mint handoff.
---

# Mint Generate

Use the Mint MCP tools exposed by the current host.

## Defaults

- Before the first billable multi-asset workflow, call `who_am_i` once and
  require `preflight.readyForAssetPipeline`. If it is false, follow its
  `recommendedAction` on the connected Mint MCP server and stop before spend.
- Do not probe or suggest another Mint environment as an authentication
  workaround.
- Default generation and revision mode is `auto`: start and revision tools continue through final generation.
- Use `mode: "review"` only when the user explicitly asks to inspect, compare, revise, select, or approve previews before final generation.
- Show the returned `chatUrl` as the main clickable Mint generation result/status link; Modeler returns `sessionUrl` when reading its operation.
- After waiting for status, show only the Mint handoff link (`chatUrl`) and preview image when useful. Do not show raw CDN, thumbnail, pano, mesh, material map, preview, asset id, storage key, provider, or Trigger URLs from normal status tools.
- For code-project imports, prefer `get_asset_artifact_manifest`. Ordinary assets return stable `artifactId` and semantic `role` fields with `downloadUrl`, `suggestedPath`, and `loaderHint`; worlds identify the remote RAD runtime and collider in their SparkJS loader contract.
- Preserve actual Image `width`, `height`, and `aspectRatio` or audio `durationSeconds` when present. Omitted metadata is unknown; do not infer it from requested generation settings.
- Prefer discrete model or asset-pack generation when deciding how to populate a 3D scene. Treat world generation as an explicit environment-level choice with a longer generation and post-processing lifecycle; call it only when the user directly requests a Mint-generated world/environment or approves that choice.
- To fetch one selected file, use `list_asset_artifacts` followed by `get_asset_artifact`. Do not invent or scrape direct GLB/map/Image/audio URLs from `get_asset` or `wait_for_status`.
- For code-project imports, do not stop after a start tool returns `queued`. Follow `nextSteps` through final status and artifact retrieval, or clearly report that artifact retrieval is unavailable and the project is shell-only.
- If a start tool returns `status: "billing_required"`, do not poll. No generation started. Use `billing.userMessage` to explain the account entitlement or credit shortfall. Do not promote subscriptions, upgrades, credit purchases, or checkout. Show `billing.chatUrl` only as the blocked request. Do not call it a failed generation or describe the shortfall as “completion credits.”
- To fetch animation files for code-project imports, prefer `get_model_animation_artifact_manifest`. For one selected animation file, use `list_model_animation_artifacts` followed by `get_model_animation_artifact`; use returned `downloadUrl`s directly. Do not pass animation batch or clip IDs to `get_asset`.
- Treat orchestration and provider identifiers as internal Mint details. Do not ask for them or expose them.
- Use `get_asset` for polling and recovery after a start tool returns `assetType` and `assetId`.
- Treat `assetId` as the tool handle for follow-up MCP calls. Do not show it to the user unless they ask for raw IDs.
- On terminal failure, inspect `failureClass`, `failureCode`, `failureReason`, `retryable`, and `retryGuidance`. Do not expose moderation categories, model reasoning, provider errors, `workflowStageLastError`, stack traces, or internal paths. Use `retry_generation` for a retryable standalone model/world. An unavailable safety check can be retried unchanged; a completed policy block requires changed content. Resolve quota or invalid input before starting again. Asset packs keep their dedicated failed-item regeneration tool.
- Do not invent asset IDs, chat IDs, or URLs. Read them from tool outputs.
- Mint Projects are the canonical personal workspace owner. Use `list_projects`
  to find an existing destination or `create_project` when the user asks for a
  new workspace. Project creation through MCP does not change the active web
  Project.
- Every chat-based generation start requires `project_id` when `chat_id` is absent. A
  supplied `chat_id` derives its Project; if both IDs are supplied, they must
  match. Source-based edits and derivative tools inherit their source Project.
- Pass resolution, aspect ratio, transparency, and other generation controls
  only when the live tool schema exposes them. Do not present prompt wording as
  a guaranteed substitute for an unsupported control.

## Start Generation

For Modeler:

1. Use `start_modeler_generation` for a static GLB from text, owned `reference_image_ids`, or both. For images, call `upload_reference_image` (with any owned `project_id`) and pass its `referenceAssetId`, not its `imageUrl`. It uses the connected account and a Modeler session, with no Mint chat/Project ID or API key. The separate `start_model_generation` tool retains its preset/Preview workflow.
2. Choose the user's `quality_tier` and explicit `max_credits` before starting paid work. Low (the default) reserves 2,000 Credits, Medium 8,000, High 25,000, Max 100,000, and Ultra 625,000; the cap must cover the tier price. Charges are actual usage up to that price. Do not silently increase the user's budget.
3. Supply a unique `request_id`, such as a UUID. Reuse it with identical input after a lost response to avoid duplicate paid work. New work needs a new ID.
4. Follow `nextSteps` and poll `get_modeler_operation` about every 10 seconds. After `succeeded`, fetch the GLB with `get_asset_artifact_manifest`, `asset_type: "model"`, and `resource.id`. Continue polling until `modeler.billingState` is `settled`; delivery can precede billing.
5. Use `revise_modeler_model` with an owned successful `model_id`, new instructions, a new retry ID, and an authorized tier/cap. It preserves the original. Use `cancel_modeler_operation` only when the user wants to stop; already-incurred usage can still be charged.
6. Modeler has no Preview approval and does not support rigging, animation, or uploaded-model editing. Keep terminal failures visible instead of launching replacement paid work automatically.

For a model:

1. Call `start_model_generation` with `prompt` plus `project_id` when `chat_id` is absent; omit `mode` or set `mode: "auto"` for the default straight-through flow.
2. If the user wants a humanoid character that can be rigged or animated, or explicitly asks for an A-pose or T-pose, set `riggable_character`. Prefer `{"pose":"t_pose","hands":"empty"}`; use `a_pose` only when the user explicitly asks for it. This is the structured animation-readiness requirement, not a free-text prompt hint.
3. If a reference image is available, pass it as `image_url`.
4. Use `mode: "review"` only when the user explicitly asks for a preview/review step.
5. Continue bounded polling until final output is ready, then call `open_model` with the returned model ID to open the interactive 3D viewer inside Codex. A non-terminal timeout is intermediate; keep polling. Opening the viewer does not spend credits. If the host does not render MCP Apps, use `chatUrl` as the fallback.
6. For code-project imports, continue through the artifact `nextSteps`: fetch the manifest and use its `downloadUrl`s, `suggestedPath`s, and `loaderHint`s in the project. When a local `.glb` is opened in Codex, Mint's file extension viewer reads it through the host resource bridge.

For a world:

1. Call `start_world_generation` with `prompt` plus `project_id` when `chat_id` is absent; omit `mode` or set `mode: "auto"` for the default straight-through flow.
2. For one reference image, pass `image_url`.
3. For multiple reference images, pass `source_images`.
4. Use `mode: "review"` only when the user explicitly asks for a preview/review step.
5. Use `nextSteps` for polling. Success means RAD post-processing is complete; then fetch the world manifest, load its remote RAD with `@sparkjsdev/spark`, and load the accompanying collider GLB under the same transform. Keep the collider invisible and use it for any physics or collision. Do not download the world or use `list_asset_artifacts` for it.

For an asset pack:

1. Call `start_asset_pack_generation` with `prompt`, `asset_pack_type`, `style_guide`, and an explicit `items` plan.
2. Keep `item_count` equal to `items.length` when supplied.
3. Omit `mode` or set `mode: "auto"` for the default straight-through flow.
4. Use `mode: "review"` only when the user explicitly asks to inspect, select, approve, or revise preview items before final generation.
5. In review mode, wait for preview with `wait_for_status`, then revise with `revise_asset_pack_preview` or approve with `approve_asset_pack_generation`.
6. If final generation partially succeeds, call `get_asset` to inspect failed item IDs, then call `regenerate_asset_pack_failed_items` with `scope: "all_failed_items"` or `scope: "items"` plus selected `item_ids`.
7. For code-project imports, continue through `nextSteps`: wait for final status, fetch the artifact manifest, and use its `downloadUrl`s, `suggestedPath`s, and `loaderHint`s in the project.

For a material:

1. Call `start_material_generation`.
2. Use `mode: "generate"` for text-to-material, `image_to_maps` for flat texture conversion, and `extract` for extracting a surface from a photo/scene.
3. Materials are standalone PBR/material-map outputs, not model material application.
4. For code-project imports, continue through `nextSteps`; after success, use artifact tools to fetch a map ZIP or individual maps.

For video:

1. Call `start_video_generation` with `prompt` and the target `project_id` or existing `chat_id`.
2. Use `video_mode` for `text_to_video`, `image_to_video`, `first_last_frame`, or `reference_to_video`. References use owned `reference_asset_id` values and explicit `start_frame`, `end_frame`, or `reference` roles from the same Project. Upload images with `upload_reference_image`; use existing Mint video/audio references for mixed guidance.
3. Optional controls are `generation_preset` (`fast`, `standard`, `production`), whole-second `duration_seconds`, `aspect_ratio` (`16:9`, `9:16`), and `generate_audio`. Audio defaults on. Fast and Standard support 5–15 seconds and require audio; Production supports 4–15 seconds and can be silent. Unsupported references or settings fail before paid generation.
4. Video starts final generation directly. Poll with `asset_type: "video"`; after success use the artifact manifest or fetch `video_file`. Render or download the returned durable file URL and show `chatUrl` as Open in Mint.

For audio:

1. Call `start_audio_generation` with `prompt` and `audio_kind`.
2. Use `audio_kind: "sound_effect"` for SFX, UI sounds, foley, impacts, alerts, transitions, and short ambience.
3. Use `audio_kind: "general_audio"` for background music, intro music, lore music, theme music, musical loops, ambience beds, and other non-SFX audio.
4. Pass `duration_seconds` only when the user asked for a duration.
5. Audio is final-only in v1. Do not use preview, revision, approval, provider/model picker, uploaded reference audio, audio-to-audio, voice cloning, or lyrics flows.
6. For code-project imports, continue through `nextSteps`; after success, use artifact tools to fetch `audio_file`.

For a standalone Image:

1. Call `start_image_generation` with a plain-language `prompt` and optional `display_name_hint` or `chat_id`.
2. Keep the prompt lightweight when the user is exploring; this tool does not require the guided world/model prompt workflow.
3. Image generation is final-only. Poll with `asset_type: "image"` and `until_stage: "final"`.
4. To edit a finished Image, call `start_image_edit` with its `image_id` and a plain-language `edit_instruction`. Do not pass a raw image URL as the edit target.
5. Treat the edit result as a new immutable Image derivative. The source remains unchanged and the edit continues in its existing Mint chat.
6. For code-project imports, continue through `nextSteps`; after success, use artifact tools to fetch `image_file`.

## Image Inputs

Mint generation tools accept reachable image URLs. Mint MCP itself does not read local paths.

- Public image URL: pass it directly as `image_url` or in `source_images`.
- Local image path: read the file, infer `content_type`, base64 encode the bytes, call `upload_reference_image` with the destination `project_id`, then pass the returned `imageUrl` into the generation tool (for Modeler, pass `referenceAssetId` in `reference_image_ids`).
- Inline image attachment with accessible bytes: base64 encode those bytes and call `upload_reference_image` with the destination `project_id`.
- Inline image attachment without accessible bytes or path: ask the user for a local file path or public image URL.
- Supported upload MIME types are `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.

Do not tell the user that the MCP server can read local files. The agent reads local files; MCP receives base64 JSON or public URLs.

## Preview Lifecycle

Most MCP starts and revisions run automatically. Use this lifecycle only when
the user asked for a preview/review gate or when an existing asset is already
`preview_ready`.

When a preview is ready:

- To approve: call `approve_final_generation`.
- To revise: call `revise_preview` with `feedback`; omit `mode` or set `mode: "auto"` unless the user asked to review the revised preview first.
- For asset packs, use `approve_asset_pack_generation` and `revise_asset_pack_preview`; asset-pack revisions also default to `mode: "auto"`.
- For partially completed asset packs, use `regenerate_asset_pack_failed_items` to retry failed final items that already have previews.
- Prefer `chat_id` plus `target: "latest"` when continuing the current chat.
- Use explicit `asset_type` and `asset_id` when the user names a specific asset.

Approval is the MCP equivalent of clicking the preview approval button in the web UI.

## Derivative Actions

Use derivative tools only on existing succeeded generated assets:

- `optimize_generated_model` for compression/lighter GLB output.
- `retopologize_generated_model` for smart topology/quad mesh/game-ready topology.
- `list_model_animation_sets` to discover stable, curated gameplay and interaction bundles.
- `list_model_animation_options` to browse Meshy catalog options.
- `animate_generated_model` for humanoid-riggable models or humanoid asset-pack items.

For common character behavior, do not guess a set name or reconstruct it from
individual action IDs. Call `list_model_animation_sets`, choose a returned
stable `id`, then call `animate_generated_model` with that
`animation_set_id`. A set request does not need `motion_prompt`. Read each
set's semantic clip roles and `assembly` metadata when wiring the results into
a game; armed, seated, prop, and environment interactions may describe a
separate companion asset that the game should attach or align.

Use `list_model_animation_options` for a custom selection outside the curated
sets. In that path, provide `motion_prompt` and optionally the exact returned
`animation_action_ids`. Never combine `animation_set_id` and
`animation_action_ids`.

For generic walk requests such as "walk", "walking", or "simple looping walk
cycle", prefer a neutral walk option such as "Casual Walk" unless the user
explicitly asks for a gendered, fashion/stage, combat, or character-specific
walk. Do not choose "Walking Woman" as the default walk cycle; reserve it for
explicit woman/female/feminine walking requests.

Do not treat optimization, retopology, or animation as new model creation. After optimization or retopology, poll the affected model/asset-pack status, then use `get_asset_artifact_manifest` for code-project imports or `list_asset_artifacts` plus `get_asset_artifact` for one selected file. After animation, use the returned batch or clip IDs with:

1. `get_model_animation` or `wait_for_model_animation`.
2. `get_model_animation_artifact_manifest` for code-project imports, or `list_model_animation_artifacts` for one selected file.
3. `get_model_animation_artifact` when fetching one selected file.

Animation tool inputs use `target_type` plus `target_id`. Valid `target_type` values are `asset_pack_animation_batch`, `model_animation_batch`, and `model_animation_clip`.

## Artifact Downloads

Use artifacts when the user needs files in a code project:

1. Ensure one asset is ready with `wait_for_status` or `get_asset`. For 2-25 existing asset handles, use `wait_for_many` with one bounded timeout.
2. For one code-project asset, call `get_asset_artifact_manifest` with `asset_type: "world"`, `"model"`, `"asset_pack"`, `"material"`, `"image"`, or `"audio"`, `"video"`. For multiple existing assets, call `get_asset_artifact_manifests`; import ready entries and retain unavailable entries for targeted retry instead of discarding partial success.
3. For ordinary assets, use each entry's stable `artifactId`, semantic `role`, `suggestedPath`, `loaderHint`, and `downloadUrl`. When role is `preview_image`, sync it and use the local path as the viewer thumbnail; do not surface the raw URL. For worlds, keep `runtime.runtimeUrl` remote, retain the runtime and collider artifact IDs, load `runtime.collider.runtimeUrl` invisibly under the same transform, and use the collider for physics.
4. For one selected file, call `list_asset_artifacts`, pick the desired artifact ID, then call `get_asset_artifact`.
5. Show `mintUrl` if the user wants to open the asset in Mint.

Normal read/status tools intentionally do not return final GLB, material map, Image file, audio file, provider, storage, or file `downloadUrl`s.

For R3F app work, load model artifacts with `useGLTF(downloadUrl)` or download them into a stable project path first. Starting a generation and saving only `chatUrl` is not enough for an asset-backed game/app/template proof of concept.

For animation downloads:

1. Ensure the animation target is complete with `wait_for_model_animation`.
2. For code-project imports, call `get_model_animation_artifact_manifest`.
3. Use each manifest entry's stable `artifactId`, semantic `role`, `suggestedPath`, and `loaderHint` to wire files into the project.
4. For one selected animation file, call `list_model_animation_artifacts`, pick a rigged-character GLB/FBX or animation-clip GLB/FBX artifact ID, then call `get_model_animation_artifact`.
5. Show `mintUrl` if the user wants to open the source asset in Mint. Use `downloadUrl` as the durable generated file URL.

Normal animation read/status tools intentionally do not return raw animation GLB/FBX URLs.

## Polling

If the user asks to wait or check status:

1. Prefer `wait_for_status` for one returned `assetType` and `assetId`. For 2-25 existing asset handles, use `wait_for_many` and preserve every per-asset result.
2. Summarize `status` only when useful.
3. Show `chatUrl` as the clickable Mint handoff link.
4. Do not show raw CDN, thumbnail, pano, mesh, material map, audio file, preview, asset id, storage key, provider, or Trigger URLs from tool output.
5. If `terminal` is false, follow `retryGuidance`; do not hold the MCP request open for the full generation. If it failed, use the typed failure fields to decide whether `retry_generation` is allowed.
6. Keep updates short while the asset is still queued or processing.
7. Keep `timeout_ms` at or below `60000`.

Existing non-Modeler `chatUrl` values open generation results and status. They do not open a Spatial chat transcript or composer. Modeler `sessionUrl` opens its separate modeling conversation on mint.gg.
