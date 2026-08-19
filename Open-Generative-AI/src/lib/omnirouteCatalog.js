// Adapter that turns the real model catalogs into OmniRoute candidates.
//
// Cloud models come from the studio catalog (served through MuAPI) and
// describe their capabilities inside `inputs`; local models come from
// LOCAL_MODEL_CATALOG and describe them as flat fields. This module flattens
// both into the single shape omniroute.js consumes.

import {
    t2iModels,
    i2iModels,
    t2vModels,
    i2vModels,
    v2vModels,
    lipsyncModels,
    audioModels,
} from './models.js';
import { LOCAL_MODEL_CATALOG } from './localModels.js';
import { TASKS, normalizeCandidate, routeRequest } from './omniroute.js';

const enumOf = (model, field) => model?.inputs?.[field]?.enum ?? null;

function cloudCandidate(model, task) {
    const duration = model?.inputs?.duration;
    return normalizeCandidate({
        id: model.id,
        name: model.name,
        task,
        provider: 'muapi',
        local: false,
        endpoint: model.endpoint || model.id,
        family: model.family || null,
        description: model.description || '',
        aspectRatios: enumOf(model, 'aspect_ratio'),
        resolutions: enumOf(model, 'resolution'),
        durationRange: duration
            ? { min: duration.minValue ?? null, max: duration.maxValue ?? null }
            : null,
        tags: model.tags ?? [],
        featured: !!model.featured,
    });
}

/** Maps a LOCAL_MODEL_CATALOG entry onto the task it can serve. */
function localTaskOf(model) {
    if (model.provider === 'sdcpp') return TASKS.T2I;
    if (model.type === 'image') return TASKS.T2I;
    if (model.type === 'video') return model.needsImage ? TASKS.I2V : TASKS.T2V;
    return null;
}

function localCandidate(model, { installed, wan2gpReady } = {}) {
    const task = localTaskOf(model);
    if (!task) return null;

    // sd.cpp models need their weights on disk; Wan2GP models need the user's
    // server to answer. When the caller does not tell us, assume available.
    let ready = true;
    let unavailableReason = null;
    if (model.provider === 'sdcpp' && installed && !installed.has(model.id)) {
        ready = false;
        unavailableReason = 'weights are not downloaded yet';
    }
    if (model.provider === 'wan2gp' && wan2gpReady && wan2gpReady.get) {
        const probe = wan2gpReady.get(model.id);
        if (probe && probe.ready === false) {
            ready = false;
            unavailableReason = probe.reason || 'Wan2GP server unavailable';
        }
    }

    return normalizeCandidate({
        id: model.id,
        name: model.name,
        task,
        provider: model.provider,
        local: true,
        description: model.description || '',
        family: model.family || null,
        aspectRatios: model.aspectRatios ?? null,
        needsImage: !!model.needsImage,
        tags: model.tags ?? [],
        featured: !!model.featured,
        ready,
        unavailableReason,
    });
}

/**
 * Builds the unified candidate list.
 *
 * @param {Object} [options]
 * @param {Set<string>} [options.installed]   sd.cpp model ids whose weights are on disk
 * @param {Map<string, {ready: boolean, reason?: string}>} [options.wan2gpReady]  Wan2GP probe results
 * @param {boolean} [options.includeCloud=true]
 * @param {boolean} [options.includeLocal=true]
 */
export function getOmniCatalog(options = {}) {
    const { includeCloud = true, includeLocal = true } = options;
    const candidates = [];

    if (includeCloud) {
        const cloudGroups = [
            [t2iModels, TASKS.T2I],
            [i2iModels, TASKS.I2I],
            [t2vModels, TASKS.T2V],
            [i2vModels, TASKS.I2V],
            [v2vModels, TASKS.V2V],
            [lipsyncModels, TASKS.LIPSYNC],
            [audioModels, TASKS.AUDIO],
        ];
        for (const [models, task] of cloudGroups) {
            for (const model of models ?? []) {
                candidates.push(cloudCandidate(model, task));
            }
        }
    }

    if (includeLocal) {
        for (const model of LOCAL_MODEL_CATALOG) {
            const candidate = localCandidate(model, options);
            if (candidate) candidates.push(candidate);
        }
    }

    return candidates;
}

/**
 * Convenience entry point: route a request against the live catalogs.
 * See routeRequest in omniroute.js for the request and result shapes.
 */
export function routeGeneration(request, options = {}) {
    return routeRequest(request, getOmniCatalog(options));
}

export { TASKS, explainRoute } from './omniroute.js';
