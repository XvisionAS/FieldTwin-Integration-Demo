import { test } from 'node:test'
import assert from 'node:assert/strict'

import { stagedAssetUrl, subProjectUrl } from '../src/apiClient.js'

const ids = { projectId: 'p', subProjectId: 'sp', streamId: 'st' }

test('subProjectUrl builds the v1.10 sub-project endpoint', () => {
  assert.equal(
    subProjectUrl({ api: 'https://host/', ...ids }),
    'https://host/API/v1.10/p/subProject/sp:st'
  )
})

test('stagedAssetUrl builds the v1.10 staged-asset endpoint', () => {
  assert.equal(
    stagedAssetUrl({ api: 'https://host', ...ids, id: 'a1' }),
    'https://host/API/v1.10/p/subProject/sp:st/stagedAssets/a1'
  )
})

test('URLs do not double the version segment when the base already includes it', () => {
  assert.equal(
    subProjectUrl({ api: 'https://host/API/v1.10/', ...ids }),
    'https://host/API/v1.10/p/subProject/sp:st'
  )
  assert.equal(
    stagedAssetUrl({ api: 'https://host/API/v1.10', ...ids, id: 'a1' }),
    'https://host/API/v1.10/p/subProject/sp:st/stagedAssets/a1'
  )
})
