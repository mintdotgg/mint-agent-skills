---
name: mint-read
description: Use when the user wants to inspect Mint account state, credits, context, owned assets, Studio projects, asset status, preview images, or Mint chat handoff links through Mint MCP without starting billable generation.
---

# Mint Read

Use the Mint MCP tools exposed by the current host. Prefer read tools unless the user explicitly asks to create, revise, or approve generation.

## Tools

- `who_am_i`: confirm the authenticated Mint user identity, scopes, subscription summary, and compact credit summary.
- `get_credits_balance`: read included monthly credits, top-up credits, free preview budget, and billing blockers.
- `get_mint_context`: get a bounded account/context snapshot.
- `list_my_assets`: browse owned worlds, models, and Studio project assets.
- `list_studio_projects`: browse Studio projects.
- `get_asset`: fetch one owned asset by `asset_type` and `asset_id`.

## Asset Status

Use the asset's own `status` field as the lifecycle signal.

- `preview_ready`: a review-mode preview is ready; final generation still needs approval.
- `processing` or `queued`: generation is still running.
- `succeeded`: final output is available when the asset includes the relevant URLs.
- `failed` or `cancelled`: summarize the state and avoid retrying unless the user asks.

Do not expose Trigger run IDs, provider job IDs, or provider-specific status names. Those are internal implementation details.

## URLs

- Show `chatUrl` when available so the user can continue in Mint.
- For generated assets, prefer only the Mint handoff link. Do not show raw CDN, thumbnail, pano, mesh, preview, asset id, or provider URLs unless the user explicitly asks for raw asset data.
- Do not show direct GLB URLs. Tell the user to open `chatUrl` in Mint for the final model.
- If a URL is missing, say which status you saw instead of guessing.

## Credits

- Treat `credits.totalAvailable` as the user's usable credit total when present.
- Also show the components when relevant: `credits.monthlyRemaining` from subscription allowance and `credits.topUpBalance` from purchased or granted top-up credits.
- Do not describe `credits.topUpBalance` alone as all available credits.

## Boundaries

- Do not call `start_model_generation`, `start_world_generation`, `revise_preview`, `approve_final_generation`, or `upload_reference_image` unless the user explicitly asks for a generation action.
- If the user asks to approve or revise a preview, switch to `mint-generate`.
