import { assert, test, expect } from 'vitest'

import { pause, runScenario, dhtSync } from '@holochain/tryorama'
import { Record, Link } from '@holochain/client'
import { decode } from '@msgpack/msgpack'

import { createComment, createPost } from './common.js'

test('create Comment', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a Comment
    const record: Record = await createComment(alice.cells[0])
    assert.ok(record)
  })
})

test('create and read Comment', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a Post
    const postRecord: Record = await createPost(alice.cells[0])
    assert.ok(postRecord)

    let commentContent = {
      content: 'Lorem ipsum.',
      post_hash: postRecord.signed_action.hashed.hash,
      author: alice.cells[0].cell_id[1],
    }

    // Alice creates a Comment on her post
    const commentRecord: Record = await createComment(
      alice.cells[0],
      commentContent
    )
    assert.ok(commentRecord)

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Bob gets the created Comment
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'get_original_comment',
      payload: commentRecord.signed_action.hashed.hash,
    })
    assert.deepEqual(
      commentContent,
      decode((createReadOutput.entry as any).Present.entry) as any
    )

    // Bob gets the new Comment from the post
    let linksToPosts: Link[] = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'get_comments_for_post',
      payload: postRecord.signed_action.hashed.hash,
    })
    assert.equal(linksToPosts.length, 1)
    assert.deepEqual(
      linksToPosts[0].target,
      commentRecord.signed_action.hashed.hash
    )
  })
})

test('create and update Comment', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a Post

    const postRecord: Record = await createPost(alice.cells[0])
    assert.ok(postRecord)

    // Alice creates a Comment
    const commentRecord: Record = await createComment(alice.cells[0], {
      content: 'Lorem ipsum.',
      post_hash: postRecord.signed_action.hashed.hash,
      author: alice.cells[0].cell_id[1],
    })
    assert.ok(commentRecord)

    // Alice updates the Comment
    let contentUpdate = {
      content: 'Lorem ipsum.',
      post_hash: postRecord.signed_action.hashed.hash,
      author: alice.cells[0].cell_id[1],
    }
    let updateInput = {
      previous_comment_hash: commentRecord.signed_action.hashed.hash,
      updated_comment: contentUpdate,
    }

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'update_comment',
      payload: updateInput,
    })
    assert.ok(updatedRecord)

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Bob gets the updated Comment
    const readUpdatedOutput: Record = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'get_latest_comment',
      payload: updatedRecord.signed_action.hashed.hash,
    })
    assert.deepEqual(
      contentUpdate,
      decode((readUpdatedOutput.entry as any).Present.entry) as any
    )
  })
})

test('create and delete Comment', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a Post
    const postRecord: Record = await createPost(alice.cells[0])
    assert.ok(postRecord)

    // Alice creates a Comment
    const commentRecord: Record = await createComment(alice.cells[0], {
      content: 'Lorem ipsum.',
      post_hash: postRecord.signed_action.hashed.hash,
      author: alice.cells[0].cell_id[1],
    })
    assert.ok(commentRecord)

    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Bob gets the Posts for the new Comment
    let linksToPosts: Link[] = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'get_comments_for_post',
      payload: postRecord.signed_action.hashed.hash,
    })
    assert.equal(linksToPosts.length, 1)
    assert.deepEqual(
      linksToPosts[0].target,
      commentRecord.signed_action.hashed.hash
    )

    // Alice deletes the Comment
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'delete_comment',
      payload: commentRecord.signed_action.hashed.hash,
    })
    assert.ok(deleteActionHash)

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Bob gets the Posts for the new Comment again
    linksToPosts = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'get_comments_for_post',
      payload: postRecord.signed_action.hashed.hash,
    })
    assert.equal(linksToPosts.length, 0)
  })
})

test('create comment >= max length', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a Comment
    // Create a post for the comment with a content of < 15 characters
    let record: Record = await createComment(alice.cells[0], {
      content: 'Short comment',
      post_hash: (await createPost(alice.cells[0])).signed_action.hashed.hash,
      author: alice.cells[0].cell_id[1],
    })
    assert.ok(record)

    // Create a new post for the comment with a content of >= 15 characters
    // Alice attempts to create a Comment
    // Expect createComment to throw an error due to validation failure
    await expect(async () => {
      await createComment(alice.cells[0], {
        content: 'Very very long comment',
        post_hash: (await createPost(alice.cells[0])).signed_action.hashed.hash,
        author: alice.cells[0].cell_id[1],
      })
    }).rejects.toThrow('Source chain error')
  })
})

test('agent can only update their comments', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    // Alice creates a post
    let post = await createPost(alice.cells[0])
    assert.ok(post)

    let aliceComment: Record = await alice.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'create_comment',
      payload: {
        content: 'Lorem ipsum.',
        post_hash: post.signed_action.hashed.hash,
        author: alice.cells[0].cell_id[1],
      },
    })
    assert.ok(aliceComment)

    // Alice updates there Comment
    let aliceUpdatedRecord: Record = await alice.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'update_comment',
      payload: {
        previous_comment_hash: aliceComment.signed_action.hashed.hash,
        updated_comment: {
          content: 'ipsum Lorem',
          post_hash: post.signed_action.hashed.hash,
          author: alice.cells[0].cell_id[1],
        },
      },
    })
    assert.ok(aliceUpdatedRecord)

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Bob creates a Comment on post
    let bobComment: Record = await bob.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'create_comment',
      payload: {
        content: 'Lorem ipsum.',
        post_hash: post.signed_action.hashed.hash,
        author: bob.cells[0].cell_id[1],
      },
    })
    assert.ok(bobComment)

    await dhtSync([alice, bob], alice.cells[0].cell_id[0])

    // Alice tries to update Bobs comment
    await expect(alice.cells[0].callZome({
      zome_name: 'blog',
      fn_name: 'update_comment',
      payload: {
        previous_comment_hash: bobComment.signed_action.hashed.hash,
        updated_comment: {
          content: 'ipsum Lorem',
          post_hash: post.signed_action.hashed.hash,
          // Alice is pretending to be Bob
          author: alice.cells[0].cell_id[1],
        },
      },
    })).rejects.toThrow('Source chain error')
  })
})

test('allow 3 comments in 1 hour, but 4th comment after 1 hour', async () => {
  await runScenario(async (scenario) => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/c-2.happ'

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } }

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ])

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents()

    //NOTE this doesn't accurately test the time check in the validation code as tryorama doesn't enable easy time manipulation.
    //You can change the time values in the validation code and use the pause function from tryorama to ensure your logic is correct

    // Alice creates 3 comments within 1 hour
    const recordOne: Record = await createComment(alice.cells[0])
    assert.ok(recordOne)

    const recordTwo: Record = await createComment(alice.cells[0])
    assert.ok(recordTwo)

    const recordThree: Record = await createComment(alice.cells[0])
    assert.ok(recordThree)

    // temporarily change your TIME_DIFFERENCE variable to 5000 in the validation code and uncomment this line to ensure your logic is correct
    //await pause(5000)

    // Alice creates a 4th comment, it should fail
    await expect(createComment(alice.cells[0])).rejects.toThrow('Source chain error')   
  })
})
