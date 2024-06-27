# Challenge 3 - Testing and Validation

In the last challenged we learned how to use links through creating a blogging app. If you completed that, this challenge should feel familar. We will be learning testing and validation by continuing where we left off.

In this challenge we will be learning tests, and using TDD to learn how to write validation rules. Some of the learnings will include:

- [ ] 1. Navigating Vitest and Tryorama
- [ ] 2. Testing CRUD zomes calls.
- [ ] 3. Only allowing creation of comments under a maximum charactor limit
- [ ] 4. Only allowing editing of your own comments
- [ ] 5. Only allow a user to comment 3 times per 24 hours

<details>
<summary>
What is TDD?
</summary>
Test-Driven Development (TDD) is a coding approach where you write tests for your features before writing the actual code. It works in short cycles: you start by writing a test for a small part of the feature, then write the code to make the test pass.

As you continue developing your app, you can also continue testing the code on old tests you wrote, to make sure that you haven't broken something along the way.

</details>

## Setup

#### 1. Fork this repo and clone it onto your local machine

#### 2. cd into `c-3` directory and run `nix develop`.

#### 3. Run `npm i` to install package dependencies

#### 4. If you didn't complete the last challenge, run `npm start` and have a play around with the current app to understand its components

## Navigating Vitest and Tryorama

Vitest is a popular Javascript Framework for testing. It provides a simple setup for creating and running test scenarios, for all sorts of applications.

#### 1. Inside your terminal, run `npm test`

This command will execute every file ending in `.test.ts` within the `tests/src` directory (or any of its subdirectories).

To run a specific test or group of tests, you can specify the file name, or folder/folder path containing it

Eg: `npm test all-posts`, `npm test blog/practice`

#### 2. Run a specific file of your choosing

#### 3. Navigate to `tests/src/blog/practice/barebones.test.ts`

This is a test at its simplest. When the file is executed, every call to `assert` validates the truthiness of the first argument.

If the value is truthy, the test passes, otherwise it fails.

There are many Vitest methods for creating assertions that you will see throughout this challenge. For more information, consult the [Vitest documentation](https://vitest.dev/api/assert.html).

#### 4. Uncomment the second assert and run the barebones test

On your terminal, you will notice that see a very helpful message detailing that our test failed

#### 5. Re-comment the failing assert inside of the barebones test, and navigate to `all-posts.test.ts` and have a read through the file

Here we introduce a more complex test that utilizes Tryorama - Holochains toolkit for running tests.

Try understand the different parts going on inside the file

- Notice how just like our barebones test, `assert` and `test` are the only functions being imported from vitest, everything else is related to tryorama
- Notice how inside the file, our test is making zome calls in a similar fashion to how we do on the client.

## Testing CRUD zomes calls

Similar to how the tests are written inside `post.test.ts`, we are going to create scripts to test the Create, Read, Update, and Delete functionality of our comment entry type.

#### 1. Read through through the file inside of `common.ts`

These functions will be used multiple times throughout our tests. It will be helpful to understand how they work.

#### 2. Navigate to `comment.test.ts` and create a test and run a test for checking if Agents can create comments on the DHT

- Start with a `test()` function
- Create a scenario
- Install the app with the correct path
- Add two agents to the the scenario, and share them on the network
- Make a call to `createComment`
- Use `assert.ok(record)` to validate the whether a record was returned (the test succeded) or a record was not returned (the test failed)

Try do it without the hint! If you're struggling, you can also refer to `post.test.ts` to see the implementation of a similar test.

You can run `npm test comment` to execute your new code

<details>
<summary>
Hint
</summary>

```ts
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
```

</details>

#### 3. Create and run a test for checking if Agents can read/retrieve comments on the DHT

This test is a bit more complex. There will be multiple `assert` functions for testing each of these functions:

- The creation of a comment (To read comments from the DHT, we also need to create them inside the same scenario)
- Retrieval of a test by its action hash
- Retreval of comments by there corresponding post

<details>
<summary>
Hint #1 - Breakdown of each step
</summary>

- Create a `test()` function that asserts the creation of a comment
- Use `dhtSync` to await the propergation of the entry around the network
- Create another `assert()` for testing the zome function `get_original_comment`
- Retrieve all comments by their post hash
- Create another `assert()` for checking if the retrieved comments contains the one we created

</details>

#### 4. Create a test for checking if Agents can update comments on the DHT

The assertions in this test should include

- Creation of a comment
- Updating of a comment
- Retreval of the latest update of a comment

#### 5. Create a test for checking if Agents can delete comments on the DHT

The assertions in this test should include

- Creation of a comment
- Deletion of a comment
- Retreval of all comments does not return the deleted comment

## Only allowing creation of comments under a maximum charactor limit

Now you have a better idea of testing with Holochain, we are going to use TDD to write some validation rules.

#### 1. Write a test that checks to see that only comments under 15 charactors are being validated.

The assertions of this test should include:

- A check that a comment under 15 charactors can be created
- A check that a comment over or equal to 15 charactors cannot be created

As we haven't written the validation rule yet, the test should be failing on the second assert.

The file `comment.test.ts` might be getting a bit large, so feel free to create a new `comment-validation.test.ts`

#### 2. Navigate to `dnas/blog/zomes/integrity/blog/src/comment.rs`

The file contains many functions for implementing validation rules, however you will notice that in most of the functions, there isn't alot going on.

#### 3. Implement a validation rule to make sure that the content of the comment attempting to be created is < 15 charactors long

Validation rules may seem like they are complicated, but under the hood, they are simple logical checks.

- To fail a validation check, return `Ok(ValidateCallbackResult::Invalid())`.
- To Pass validation check, return `Ok(ValidateCallbackResult::Valid)`.

<details>
<summary>
Hint
</summary>

Modify your validation function to look like this

```rust
pub fn validate_create_comment(
    _action: EntryCreationAction,
    comment: Comment
) -> ExternResult<ValidateCallbackResult> {
    match comment.content.chars().count() < 15 {
        true => {
            let record = must_get_valid_record(comment.post_hash.clone())?;
            let _post: crate::Post = record
                .entry()
                .to_app_option()
                .map_err(|e| wasm_error!(e))?
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(
                            String::from("Dependant action must be accompanied by an entry")
                        )
                    )
                )?;
            Ok(ValidateCallbackResult::Valid)
        }
        false =>
            Ok(
                ValidateCallbackResult::Invalid(
                    "Validation Error: Comment is >= 15 charactors!".to_string()
                )
            ),
    }
}
```

</details>

#### 4. View your validation rule working in the UI!

## Only allowing editing of your own comments

#### 1. Write a test that creates, and updates a comment entry

The assertions of this test should include:

- A check if an agent can update there own comment
- A check if an agent cannot update another agents comment

#### 2. Create a validation rule for only allowing agents to update there own comments

<details>
<summary>
Hint
</summary>

`record.action().author()` retrieves the public key of the author of the action. The reason we compare against it instead of `Comment.author`, is because we can't trust the value of `Comment.author`, -it could've been modified by the client.

```rust
pub fn validate_update_comment(
    _action: Update,
    _comment: Comment,
    _original_action: EntryCreationAction,
    _original_comment: Comment
) -> ExternResult<ValidateCallbackResult> {
    let _record = must_get_valid_record(_comment.post_hash.clone())?;
    let author = _original_action.author().clone();

    match author == _comment.author && author == _action.author {
        true => Ok(ValidateCallbackResult::Valid),
        false =>
            Ok(
                ValidateCallbackResult::Invalid(
                    "Comment can only be edited by the original author".to_string()
                )
            ),
    }
}
```

</details>

## Only allow a user to comment 3 times per 24 hours

#### 1. Write a test that creates a comment

The assertions of this test should include:

- A check if an agent can create a comment
- A check if an agent cannot create more than three comments during the test

#### 2. Create a validation rule for only allowing agents to update there own comments

You will need to use the `must_get_agent_activity` function to deterministically retrieve information about previous actions made on the agents source chain.

This validation logic is a bit more complex. Give it your best shot, but if you are struggling, refer to the challenge solutions for help.

And thats the end of it! There are many more validation rules we could create. (Eg: Can't update comments with a length of more than 15 charaters)

Feel free to implement anymore!
