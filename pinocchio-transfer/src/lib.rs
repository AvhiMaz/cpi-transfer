#![allow(unused_variables)]
#![allow(unexpected_cfgs)]
pub const ID: [u8; 32] = [0; 32];

use pinocchio::{
    ProgramResult,
    account_info::AccountInfo,
    entrypoint,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if accounts.len() < 2 {
        msg!("Error: Not enough account keys.");
        return Err(ProgramError::NotEnoughAccountKeys);
    }

    let from = &accounts[0];
    let to = &accounts[1];

    if !from.is_signer() {
        msg!("Error: Missing required signature.");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let amount = if instruction_data.len() >= 8 {
        u64::from_le_bytes(instruction_data[..8].try_into().unwrap())
    } else {
        msg!("Error: Invalid instruction data.");
        return Err(ProgramError::InvalidInstructionData);
    };

    let message = format!(
        "Transferring {:?} lamports from {:?} to {:?}",
        amount,
        from.key(),
        to.key()
    );

    msg!(&message);

    if from.lamports() < amount {
        msg!("Error: Sender does not have enough lamports!");
        return Err(ProgramError::InsufficientFunds);
    }

    let account_metas: [AccountMeta; 2] = [
        AccountMeta::writable_signer(from.key()),
        AccountMeta::writable(to.key()),
    ];

    let mut instruction_data = [0; 12];
    instruction_data[0] = 2;
    instruction_data[4..12].copy_from_slice(&amount.to_le_bytes());

    let instruction = Instruction {
        program_id: &crate::ID,
        accounts: &account_metas,
        data: &instruction_data,
    };

    invoke_signed(&instruction, &[&from.clone(), &to.clone()], &[])?;

    msg!("Transfer complete!");
    Ok(())
}
