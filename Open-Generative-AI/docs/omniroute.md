# OmniRoute

OmniRoute is the model-selection layer for Open Generative AI. The catalog
carries 250+ models — cloud models served through MuAPI plus the local sd.cpp
and Wan2GP models — and each one supports a different set of aspect ratios,
resolutions and clip durations. OmniRoute takes a task-level request and
answers a single question: *which model can actually serve this, and what do
we fall back to if it can't?*

```js
import { routeGeneration, explainRoute, TASKS } from '../lib/omnirouteCatalog.js';

const result = routeGeneration({
    task: TASKS.T2V,
    prompt: 'a lighthouse in a storm',
    aspectRatio: '9:16',
    duration: 8,
    resolution: '1080p',
});

console.log(explainRoute(result));
// OmniRoute: t2v → grok-imagine-text-to-video via muapi — declares 9:16
//            (fallbacks: hunyuan-fast-text-to-video, hunyuan-text-to-video, …)

result.model.id;          // the pick
result.model.endpoint;    // what MuapiClient needs
result.alternates;        // ranked fallbacks, same shape as model
result.rejected;          // every near-miss, with a reason code
```

## Layout

| File | Role |
| --- | --- |
| `src/lib/omniroute.js` | The router. Pure — no catalog imports, no network, no globals. |
| `src/lib/omnirouteCatalog.js` | Flattens the studio catalog and `LOCAL_MODEL_CATALOG` into candidates and exposes `routeGeneration`. |
| `tests/omniroute.test.mjs` | Router tests against a small fixture catalog (`npm test`). |

## Request fields

| Field | Meaning |
| --- | --- |
| `task` | One of `TASKS`: `t2i`, `i2i`, `t2v`, `i2v`, `v2v`, `lipsync`, `audio`. Required. |
| `aspectRatio`, `resolution`, `duration` | Hard requirements. A model that declares its supported values and does not cover yours is dropped. |
| `image`, `video` | Source assets. `i2i`/`i2v` models are dropped without an image, `v2v` without a video. |
| `prefer` | `'local'`, `'cloud'` or `'auto'` (default). A preference, not a filter. |
| `offline` | Hard filter: only local models survive. |
| `hasApiKey` | Defaults to `true`. When `false`, every MuAPI model is dropped. |
| `providers` | Allow-list of provider ids (`muapi`, `sdcpp`, `wan2gp`). |
| `family`, `tags` | Soft preferences that push matching models up the ranking. |
| `exclude` | Model ids to skip — useful for retrying after a failure. |
| `pin` | Force one model id. If it fails a hard constraint the router falls through and reports why in `pinFailed`. |
| `maxAlternates` | How many fallbacks to return (default 3). |

## Result

`{ task, model, alternates, rejected, rejectionSummary, pinned, pinFailed, request }`

`model` is `null` when nothing matched — read `rejectionSummary` (a
`code → count` tally) to tell the user what to relax. Rejection codes:
`excluded`, `provider-not-allowed`, `unavailable`, `requires-network`,
`missing-api-key`, `needs-image`, `needs-video`, `aspect-ratio-unsupported`,
`resolution-unsupported`, `duration-unsupported`. Models built for a different
task are filtered out silently rather than reported as rejections.

## Ranking

Every eligible candidate is scored, and ties break on model id so routing is
deterministic. The weights live in `WEIGHTS` (`omniroute.js`):

| Signal | Weight |
| --- | --- |
| Matches `prefer` (local or cloud) | 40 |
| Matches the requested `family` | 30 |
| Each matching tag (capped at 30) | 10 |
| Featured model | 8 |
| Explicitly declares the requested aspect ratio | 3 |

## Availability

Local models are not always usable, so `getOmniCatalog` / `routeGeneration`
take a second options argument:

```js
routeGeneration(request, {
    installed: new Set(['z-image-turbo']),                                  // sd.cpp weights on disk
    wan2gpReady: new Map([['wan2gp:wan22-t2v', { ready: false, reason: 'server offline' }]]),
    includeCloud: true,
    includeLocal: true,
});
```

Anything omitted is assumed available, so callers can adopt the router first
and wire probe results in later.
