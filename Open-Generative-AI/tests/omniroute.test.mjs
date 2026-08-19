import test from 'node:test';
import assert from 'node:assert/strict';

import {
    TASKS,
    WEIGHTS,
    normalizeCandidate,
    routeRequest,
    explainRoute,
} from '../src/lib/omniroute.js';

// A small stand-in for the real catalogs: two cloud video models, one local
// image model, one cloud image model.
const catalog = [
    {
        id: 'seedance-lite-t2v',
        name: 'Seedance Lite',
        task: TASKS.T2V,
        provider: 'muapi',
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['480p', '720p', '1080p'],
        durationRange: { min: 3, max: 12 },
        family: 'seedance',
        tags: ['fast'],
    },
    {
        id: 'ltx-cloud-t2v',
        name: 'LTX Cloud',
        task: TASKS.T2V,
        provider: 'muapi',
        aspectRatios: ['16:9'],
        resolutions: ['480p'],
        durationRange: { min: 2, max: 5 },
        family: 'ltx',
    },
    {
        id: 'wan2gp:wan22-t2v',
        name: 'Wan 2.2',
        task: TASKS.T2V,
        provider: 'wan2gp',
        aspectRatios: ['16:9', '1:1', '9:16'],
        family: 'wan',
        tags: ['video'],
    },
    {
        id: 'z-image-turbo',
        name: 'Z-Image Turbo',
        task: TASKS.T2I,
        provider: 'sdcpp',
        aspectRatios: ['1:1', '16:9'],
        tags: ['fast', 'local'],
        featured: true,
    },
    {
        id: 'flux-dev',
        name: 'Flux Dev',
        task: TASKS.T2I,
        provider: 'muapi',
        aspectRatios: ['1:1', '16:9', '21:9'],
        family: 'flux',
    },
];

const route = (request) => routeRequest(request, catalog);

test('normalizeCandidate infers locality, key requirement and asset needs from the task', () => {
    const local = normalizeCandidate({ id: 'z-image-turbo', task: TASKS.T2I, provider: 'sdcpp' });
    assert.equal(local.local, true);
    assert.equal(local.requiresKey, false);

    const cloud = normalizeCandidate({ id: 'flux-dev', task: TASKS.T2I, provider: 'muapi' });
    assert.equal(cloud.local, false);
    assert.equal(cloud.requiresKey, true);

    assert.equal(normalizeCandidate({ id: 'x', task: TASKS.I2V, provider: 'muapi' }).needsImage, true);
    assert.equal(normalizeCandidate({ id: 'y', task: TASKS.V2V, provider: 'muapi' }).needsVideo, true);
    assert.equal(normalizeCandidate({ id: 'z', task: TASKS.T2V, provider: 'muapi' }).needsImage, false);
});

test('normalizeCandidate rejects candidates without an id or with an unknown task', () => {
    assert.throws(() => normalizeCandidate({ task: TASKS.T2I }), /needs an id/);
    assert.throws(() => normalizeCandidate({ id: 'a', task: 'text' }), /unknown task/);
});

test('routeRequest picks a model that satisfies every hard constraint', () => {
    const result = route({ task: TASKS.T2V, aspectRatio: '9:16', duration: 8 });

    assert.equal(result.model.id, 'seedance-lite-t2v');
    // ltx-cloud-t2v fails on both the aspect ratio and the duration cap.
    assert.ok(result.rejected.some(r => r.id === 'ltx-cloud-t2v'));
    assert.ok(result.alternates.every(a => a.id !== 'ltx-cloud-t2v'));
});

test('routeRequest reports why each candidate was dropped', () => {
    const result = route({ task: TASKS.T2V, aspectRatio: '21:9' });
    const codes = Object.fromEntries(result.rejected.map(r => [r.id, r.code]));

    assert.equal(codes['seedance-lite-t2v'], 'aspect-ratio-unsupported');
    assert.equal(codes['ltx-cloud-t2v'], 'aspect-ratio-unsupported');
    assert.equal(result.model, null);
    // Models built for another task are not reported as rejections.
    assert.ok(!('flux-dev' in codes));
});

test('routeRequest honours duration bounds at both ends', () => {
    const tooShort = route({ task: TASKS.T2V, aspectRatio: '16:9', duration: 1 });
    assert.match(
        tooShort.rejected.find(r => r.id === 'ltx-cloud-t2v').detail,
        /below the 2s minimum/,
    );

    const tooLong = route({ task: TASKS.T2V, aspectRatio: '16:9', duration: 20 });
    assert.ok(tooLong.rejected.every(r => r.code === 'duration-unsupported'));
    assert.equal(tooLong.model.id, 'wan2gp:wan22-t2v'); // declares no duration limit
});

test('offline routing keeps only local models', () => {
    const result = route({ task: TASKS.T2V, offline: true });

    assert.equal(result.model.id, 'wan2gp:wan22-t2v');
    assert.ok(result.rejected.every(r => r.code === 'requires-network'));
    assert.deepEqual(result.rejectionSummary, { 'requires-network': 2 });
});

test('a missing API key disqualifies cloud models but not local ones', () => {
    const result = route({ task: TASKS.T2I, hasApiKey: false });

    assert.equal(result.model.id, 'z-image-turbo');
    assert.deepEqual(
        result.rejected.map(r => [r.id, r.code]),
        [['flux-dev', 'missing-api-key']],
    );
});

test('prefer: local outranks a cloud model that would otherwise win', () => {
    const cloudFirst = route({ task: TASKS.T2I, family: 'flux' });
    assert.equal(cloudFirst.model.id, 'flux-dev');

    const localFirst = route({ task: TASKS.T2I, family: 'flux', prefer: 'local' });
    assert.equal(localFirst.model.id, 'z-image-turbo');
    assert.ok(localFirst.model.score > cloudFirst.model.score - WEIGHTS.family);
});

test('tag matches and featured status feed the ranking', () => {
    const result = route({ task: TASKS.T2I, tags: ['fast'] });

    assert.equal(result.model.id, 'z-image-turbo');
    assert.ok(result.model.reasons.some(r => r.includes('fast')));
    assert.ok(result.model.reasons.includes('featured model'));
});

test('image-to-video candidates are dropped when no source image is supplied', () => {
    const i2vCatalog = [
        ...catalog,
        { id: 'wan2gp:wan22-i2v', name: 'Wan 2.2 I2V', task: TASKS.I2V, provider: 'wan2gp', needsImage: true },
    ];

    const withoutImage = routeRequest({ task: TASKS.I2V }, i2vCatalog);
    assert.equal(withoutImage.model, null);
    assert.equal(withoutImage.rejected[0].code, 'needs-image');

    const withImage = routeRequest({ task: TASKS.I2V, image: 'https://example.com/a.png' }, i2vCatalog);
    assert.equal(withImage.model.id, 'wan2gp:wan22-i2v');
});

test('unavailable models are skipped with their own reason', () => {
    const result = routeRequest({ task: TASKS.T2I, hasApiKey: false }, [
        { id: 'z-image-turbo', task: TASKS.T2I, provider: 'sdcpp', ready: false, unavailableReason: 'weights are not downloaded yet' },
    ]);

    assert.equal(result.model, null);
    assert.equal(result.rejected[0].code, 'unavailable');
    assert.equal(result.rejected[0].detail, 'weights are not downloaded yet');
});

test('the provider allow-list and the exclude list both filter candidates', () => {
    const onlyWan = route({ task: TASKS.T2V, providers: ['wan2gp'] });
    assert.equal(onlyWan.model.id, 'wan2gp:wan22-t2v');

    const excluded = route({ task: TASKS.T2I, exclude: ['flux-dev'] });
    assert.equal(excluded.model.id, 'z-image-turbo');
    assert.equal(excluded.rejected.find(r => r.id === 'flux-dev').code, 'excluded');
});

test('a pinned model wins when it is eligible', () => {
    const result = route({ task: TASKS.T2I, prefer: 'local', pin: 'flux-dev' });

    assert.equal(result.model.id, 'flux-dev');
    assert.equal(result.pinned, true);
    assert.equal(result.pinFailed, null);
    assert.equal(result.model.reasons[0], 'pinned by the request');
});

test('an ineligible pin falls through and explains itself', () => {
    const result = route({ task: TASKS.T2I, hasApiKey: false, pin: 'flux-dev' });

    assert.equal(result.pinned, false);
    assert.equal(result.pinFailed.code, 'missing-api-key');
    assert.equal(result.model.id, 'z-image-turbo');

    const unknown = route({ task: TASKS.T2I, pin: 'nope' });
    assert.equal(unknown.pinFailed.code, 'not-found');
});

test('alternates form a capped fallback chain, best first', () => {
    const result = route({ task: TASKS.T2V, maxAlternates: 1 });

    assert.equal(result.alternates.length, 1);
    assert.ok(result.model.score >= result.alternates[0].score);
    assert.ok(!result.alternates.some(a => a.id === result.model.id));
});

test('routing is deterministic when scores tie', () => {
    const first = route({ task: TASKS.T2V });
    const shuffled = routeRequest({ task: TASKS.T2V }, [...catalog].reverse());

    assert.equal(first.model.id, shuffled.model.id);
    assert.deepEqual(
        first.alternates.map(a => a.id),
        shuffled.alternates.map(a => a.id),
    );
});

test('routeRequest rejects an unknown task', () => {
    assert.throws(() => routeRequest({ task: 'text-to-text' }, catalog), /unknown task/);
});

test('explainRoute summarises both a hit and a miss', () => {
    const hit = explainRoute(route({ task: TASKS.T2I, tags: ['fast'] }));
    assert.match(hit, /t2i → z-image-turbo via sdcpp/);
    assert.match(hit, /fallbacks: flux-dev/);

    const miss = explainRoute(route({ task: TASKS.T2V, aspectRatio: '21:9' }));
    assert.match(miss, /no t2v model matched/);
    assert.match(miss, /aspect-ratio-unsupported/);
});
