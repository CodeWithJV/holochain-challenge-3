use hdi::prelude::*;

use crate::UnitEntryTypes;

#[derive(Clone, PartialEq)]
#[hdk_entry_helper]
pub struct Comment {
    pub content: String,
    pub post_hash: ActionHash,
    pub author: AgentPubKey,
}

pub fn validate_create_comment(
    _action: EntryCreationAction,
    comment: Comment
) -> ExternResult<ValidateCallbackResult> {
    let agent_activity = must_get_agent_activity(_action.author().clone(), ChainFilter {
        chain_top: _action.prev_action().clone(),
        filters: ChainFilters::ToGenesis,
        include_cached_entries: true,
    })?;

    let entry_type = UnitEntryTypes::Comment.try_into()?;

    const TIME_DIFFERENCE: i64 = 1000 * 60 * 60;
    let mut comment_count = 0;
    for activity in agent_activity {
        if
            activity.action.action().action_type() == ActionType::Create &&
            activity.action.action().entry_type().unwrap().clone() == entry_type
        {
            if
                _action.timestamp().as_millis() - activity.action.action().timestamp().as_millis() >
                TIME_DIFFERENCE
            {
                break;
            } else {
                comment_count += 1;
            }
        } else {
            continue;
        }
    }

    // The source chain won't contain the comment currently being created
    // So our total number of comments will be source chain total + 1.

    if comment_count >= 3 {
        Ok(ValidateCallbackResult::Invalid("Validation Error: Comment count is >= 4".to_string()))
    } else {
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
}

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
pub fn validate_delete_comment(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_comment: Comment
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_create_link_post_to_comments(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = base_address
        .into_action_hash()
        .ok_or(
            wasm_error!(WasmErrorInner::Guest("No action hash associated with link".to_string()))
        )?;
    let record = must_get_valid_record(action_hash)?;
    let _post: crate::Post = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(WasmErrorInner::Guest("Linked action must reference an entry".to_string()))
        )?;
    // Check the entry type for the given action hash
    let action_hash = target_address
        .into_action_hash()
        .ok_or(
            wasm_error!(WasmErrorInner::Guest("No action hash associated with link".to_string()))
        )?;
    let record = must_get_valid_record(action_hash)?;
    let _comment: crate::Comment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(WasmErrorInner::Guest("Linked action must reference an entry".to_string()))
        )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_post_to_comments(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag
) -> ExternResult<ValidateCallbackResult> {
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
