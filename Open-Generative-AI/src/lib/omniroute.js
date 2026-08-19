// OmniRoute — one request, the right model.
//
// The studio catalog spans hundreds of cloud (MuAPI) models plus the local
// sd.cpp / Wan2GP models, each with its own aspect ratios, resolutions and
// duration limits. OmniRoute takes a single task-level request ("t2v, 16:9,
// 8 seconds, prefer local") and picks the model that can actually serve it,
// with an ordered fallback chain and a rejection reason for everything else.
//
// This module is deliberately pure: it never imports a catalog and never
// touches the network. Feed it candidates (see omnirouteCatalog.js for the
// adapter that builds them from the real catalogs).

export const TASKS = Object.freeze({
    T2I: 't2i',
    I2I: 'i2i',
    T2V: 't2v',
    I2V: 'i2v',
    V2V: 'v2v',
    LIPSYNC: 'lipsync',
    AUDIO: 'audio',
});

const TASK_VALUES = new Set(Object.values(TASKS));

// Tasks that are meaningless without a source asset.
const TASK_NEEDS_IMAGE = new Set([TASKS.I2I, TASKS.I2V]);
const TASK_NEEDS_VIDEO = new Set([TASKS.V2V]);

// Scoring weights. Exported so callers (and tests) can reason about ranking
// without re-deriving the numbers.
export const WEIGHTS = Object.freeze({
    preferredProvider: 40,
    family: 30,
    tag: 10,
    maxTagBonus: 30,
    featured: 8,
    declaredAspect: 3,
});

/**
 * Fills in the optional fields of a candidate so the router can treat every
 * entry uniformly. `null` on a capability list means "unknown / unconstrained"
 * and never rejects a request; an empty array means "supports nothing".
 */
export function normalizeCandidate(raw) {
    if (!raw || !raw.id) throw new Error('OmniRoute: candidate needs an id');
    if (!TASK_VALUES.has(raw.task)) {
        throw new Error(`OmniRoute: candidate "${raw.id}" has unknown task "${raw.task}"`);
    }

    const local = raw.local ?? (raw.provider === 'sdcpp' || raw.provider === 'wan2gp');

    return {
        id: raw.id,
        name: raw.name || raw.id,
        task: raw.task,
        provider: raw.provider || (local ? 'sdcpp' : 'muapi'),
        local,
        // Cloud models go through MuAPI, which needs a key; local ones do not.
        requiresKey: raw.requiresKey ?? !local,
        endpoint: raw.endpoint || raw.id,
        family: raw.family || null,
        description: raw.description || '',
        aspectRatios: raw.aspectRatios ?? null,
        resolutions: raw.resolutions ?? null,
        durationRange: raw.durationRange ?? null,
        needsImage: raw.needsImage ?? TASK_NEEDS_IMAGE.has(raw.task),
        needsVideo: raw.needsVideo ?? TASK_NEEDS_VIDEO.has(raw.task),
        tags: raw.tags ?? [],
        featured: !!raw.featured,
        ready: raw.ready ?? true,
        unavailableReason: raw.unavailableReason || null,
    };
}

function normalizeRequest(request) {
    if (!request || !TASK_VALUES.has(request.task)) {
        throw new Error(`OmniRoute: unknown task "${request?.task}"`);
    }

    return {
        task: request.task,
        prompt: request.prompt || '',
        aspectRatio: request.aspectRatio || null,
        resolution: request.resolution || null,
        duration: request.duration ?? null,
        prefer: request.prefer || 'auto',          // 'local' | 'cloud' | 'auto'
        offline: !!request.offline,
        hasApiKey: request.hasApiKey ?? true,
        family: request.family || null,
        tags: request.tags ?? [],
        providers: request.providers ?? null,      // allow-list of provider ids
        exclude: new Set(request.exclude ?? []),
        image: request.image ?? null,
        video: request.video ?? null,
        pin: request.pin || null,                  // force a specific model id
        maxAlternates: request.maxAlternates ?? 3,
    };
}

/**
 * Hard constraints. Returns `null` when the candidate can serve the request,
 * otherwise `{ code, detail }` explaining why it cannot.
 */
function disqualify(candidate, req) {
    if (candidate.task !== req.task) {
        return { code: 'task-mismatch', detail: `serves ${candidate.task}, not ${req.task}` };
    }
    if (req.exclude.has(candidate.id)) {
        return { code: 'excluded', detail: 'explicitly excluded by the request' };
    }
    if (req.providers && !req.providers.includes(candidate.provider)) {
        return { code: 'provider-not-allowed', detail: `provider "${candidate.provider}" is not in the allow-list` };
    }
    if (!candidate.ready) {
        return { code: 'unavailable', detail: candidate.unavailableReason || 'model is not ready' };
    }
    if (req.offline && !candidate.local) {
        return { code: 'requires-network', detail: 'offline routing requested' };
    }
    if (candidate.requiresKey && !req.hasApiKey) {
        return { code: 'missing-api-key', detail: 'no MuAPI key configured' };
    }
    if (candidate.needsImage && !req.image) {
        return { code: 'needs-image', detail: 'this model requires a source image' };
    }
    if (candidate.needsVideo && !req.video) {
        return { code: 'needs-video', detail: 'this model requires a source video' };
    }
    if (req.aspectRatio && candidate.aspectRatios && !candidate.aspectRatios.includes(req.aspectRatio)) {
        return { code: 'aspect-ratio-unsupported', detail: `${req.aspectRatio} not in ${candidate.aspectRatios.join(', ')}` };
    }
    if (req.resolution && candidate.resolutions && !candidate.resolutions.includes(req.resolution)) {
        return { code: 'resolution-unsupported', detail: `${req.resolution} not in ${candidate.resolutions.join(', ')}` };
    }
    if (req.duration != null && candidate.durationRange) {
        const { min, max } = candidate.durationRange;
        if (min != null && req.duration < min) {
            return { code: 'duration-unsupported', detail: `${req.duration}s is below the ${min}s minimum` };
        }
        if (max != null && req.duration > max) {
            return { code: 'duration-unsupported', detail: `${req.duration}s exceeds the ${max}s maximum` };
        }
    }
    return null;
}

/** Soft preferences. Higher is better; ties are broken by model id. */
function score(candidate, req) {
    const reasons = [];
    let total = 0;

    if (req.prefer === 'local' && candidate.local) {
        total += WEIGHTS.preferredProvider;
        reasons.push('runs locally (preferred)');
    } else if (req.prefer === 'cloud' && !candidate.local) {
        total += WEIGHTS.preferredProvider;
        reasons.push('cloud model (preferred)');
    }

    if (req.family && candidate.family === req.family) {
        total += WEIGHTS.family;
        reasons.push(`matches the "${req.family}" family`);
    }

    const matchedTags = req.tags.filter(tag => candidate.tags.includes(tag));
    if (matchedTags.length) {
        const bonus = Math.min(matchedTags.length * WEIGHTS.tag, WEIGHTS.maxTagBonus);
        total += bonus;
        reasons.push(`tagged ${matchedTags.join(', ')}`);
    }

    if (candidate.featured) {
        total += WEIGHTS.featured;
        reasons.push('featured model');
    }
    // A model that declares the requested aspect ratio beats one that simply
    // never said which ratios it supports.
    if (req.aspectRatio && candidate.aspectRatios?.includes(req.aspectRatio)) {
        total += WEIGHTS.declaredAspect;
        reasons.push(`declares ${req.aspectRatio}`);
    }

    return { total, reasons };
}

/**
 * Routes one request across a unified candidate list.
 *
 * @param {Object} request  see normalizeRequest for the accepted fields
 * @param {Array}  candidates  raw or normalized candidates
 * @returns {{ task: string, model: Object|null, alternates: Array, rejected: Array,
 *            rejectionSummary: Object, pinned: boolean, pinFailed: Object|null,
 *            request: Object }}
 */
export function routeRequest(request, candidates) {
    const req = normalizeRequest(request);
    const pool = (candidates ?? []).map(c => (c.__omniroute ? c : { ...normalizeCandidate(c), __omniroute: true }));

    const eligible = [];
    const rejected = [];

    for (const candidate of pool) {
        const failure = disqualify(candidate, req);
        if (failure) {
            // Models built for another task are noise, not a rejection worth reporting.
            if (failure.code !== 'task-mismatch') {
                rejected.push({ id: candidate.id, name: candidate.name, ...failure });
            }
            continue;
        }
        const { total, reasons } = score(candidate, req);
        eligible.push({ ...candidate, score: total, reasons });
    }

    eligible.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    let pinned = false;
    let pinFailed = null;
    if (req.pin) {
        const index = eligible.findIndex(c => c.id === req.pin);
        if (index >= 0) {
            const [choice] = eligible.splice(index, 1);
            choice.reasons = ['pinned by the request', ...choice.reasons];
            eligible.unshift(choice);
            pinned = true;
        } else {
            // Surface why the pin could not be honoured instead of silently
            // swapping in a different model.
            pinFailed = rejected.find(r => r.id === req.pin)
                || { id: req.pin, code: 'not-found', detail: 'no candidate with that id' };
        }
    }

    // A single unmet constraint can knock out dozens of models; the tally is
    // what a UI wants to show ("43 models need network access").
    const rejectionSummary = {};
    for (const entry of rejected) {
        rejectionSummary[entry.code] = (rejectionSummary[entry.code] ?? 0) + 1;
    }

    return {
        task: req.task,
        model: eligible[0] ?? null,
        alternates: eligible.slice(1, 1 + req.maxAlternates),
        rejected,
        rejectionSummary,
        pinned,
        pinFailed,
        request: req,
    };
}

/** One-line, human-readable summary of a routing decision — handy for logs. */
export function explainRoute(result) {
    if (!result.model) {
        const blockers = result.rejected.slice(0, 3).map(r => `${r.id} (${r.code})`).join(', ');
        return `OmniRoute: no ${result.task} model matched${blockers ? ` — closest misses: ${blockers}` : ''}`;
    }
    const { model } = result;
    const why = model.reasons.length ? ` — ${model.reasons.join('; ')}` : '';
    const next = result.alternates.length ? ` (fallbacks: ${result.alternates.map(a => a.id).join(', ')})` : '';
    return `OmniRoute: ${result.task} → ${model.id} via ${model.provider}${why}${next}`;
}
