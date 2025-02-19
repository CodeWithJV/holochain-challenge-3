import { assert, expect, test } from 'vitest'

import { runScenario, dhtSync, pause } from '@holochain/tryorama'
import { Record, Link } from '@holochain/client'
import { decode } from '@msgpack/msgpack'

import { createComment, sampleComment, createPost } from './common'

test('placeholder', async () => {
  assert(1 + 1 === 2, 'I failed')
})
