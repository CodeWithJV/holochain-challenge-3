import { CallableCell } from '@holochain/tryorama'
import {
  NewEntryAction,
  ActionHash,
  Record,
  AppBundleSource,
  fakeActionHash,
  fakeAgentPubKey,
  fakeEntryHash,
  fakeDnaHash,
} from '@holochain/client'

export async function samplePost(cell: CallableCell, partialPost = {}) {
  return {
    ...{
      name: 'Lorem ipsum',
      content: 'Lorem ipsum',
      author: cell.cell_id[1],
    },
    ...partialPost,
  }
}

export async function createPost(
  cell: CallableCell,
  post = undefined
): Promise<Record> {
  return cell.callZome({
    zome_name: 'blog',
    fn_name: 'create_post',
    payload: post || (await samplePost(cell)),
  })
}

async function sampleComment(cell: CallableCell) {
  return {
    ...{
      content: 'Lorem ipsum.',
      post_hash: (await createPost(cell)).signed_action.hashed.hash,
      author: cell.cell_id[1],
    },
  }
}
export async function createComment(
  cell: CallableCell,
  comment = undefined
): Promise<Record> {
  return cell.callZome({
    zome_name: 'blog',
    fn_name: 'create_comment',
    payload: comment || (await sampleComment(cell)),
  })
}
