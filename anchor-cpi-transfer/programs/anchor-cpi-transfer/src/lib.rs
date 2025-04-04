#![allow(unexpected_cfgs)]
use anchor_lang::{
    prelude::*,
    solana_program::{self, system_instruction},
};

declare_id!("DS6oaWbXKgoCKXwwdYLSQUfjmEtNJWJXUZigo311LP26");

#[program]
pub mod anchor_cpi_transfer {
    use super::*;

    pub fn send_sol(ctx: Context<SendSol>, lamports: u64) -> Result<()> {
        ctx.accounts.send_sol(lamports)?;

        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> SendSol<'info> {
    fn send_sol(&mut self, lamports: u64) -> Result<()> {
        let ix = system_instruction::transfer(self.from.key, self.to.key, lamports);

        solana_program::program::invoke(
            &ix,
            &[
                self.from.to_account_info(),
                self.to.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )?;
        msg!(
            "Transferred {} lamports from {} to {}",
            lamports,
            self.from.key,
            self.to.key
        );
        msg!("New balance of {}: {}", self.from.key, self.from.lamports());
        msg!("New balance of {}: {}", self.to.key, self.to.lamports());
        msg!("System program: {}", self.system_program.key);

        Ok(())
    }
}
