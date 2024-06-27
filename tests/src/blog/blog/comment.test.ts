import { assert, test } from 'vitest'

import { runScenario, dhtSync } from '@holochain/tryorama'
import { Record, Link } from '@holochain/client'
import { decode } from '@msgpack/msgpack'

import { createComment, createPost } from './common.js'
