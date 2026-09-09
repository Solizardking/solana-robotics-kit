use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PREDmarket111111111111111111111111111111111");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize a prediction market for an agent arena competition
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        arena_pubkey: Pubkey,
        market_close_time: i64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.arena = arena_pubkey;
        market.total_volume = 0;
        market.market_close_time = market_close_time;
        market.is_resolved = false;
        market.winner_agent = None;
        market.bump = *ctx.bumps.get("market").unwrap();

        msg!("Prediction market initialized for arena: {}", arena_pubkey);
        Ok(())
    }

    /// Create a betting pool for a specific agent
    pub fn create_agent_pool(
        ctx: Context<CreateAgentPool>,
        agent_pubkey: Pubkey,
        agent_name: String,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.agent_pool;
        pool.market = ctx.accounts.market.key();
        pool.agent = agent_pubkey;
        pool.agent_name = agent_name.clone();
        pool.total_staked = 0;
        pool.bettor_count = 0;
        pool.implied_probability = 0;
        pool.bump = *ctx.bumps.get("agent_pool").unwrap();

        msg!("Betting pool created for agent: {}", agent_name);
        Ok(())
    }

    /// Place a bet on an agent
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
    ) -> Result<()> {
        let market = &ctx.accounts.market;

        require!(
            Clock::get()?.unix_timestamp < market.market_close_time,
            PredictionMarketError::MarketClosed
        );

        require!(
            !market.is_resolved,
            PredictionMarketError::MarketResolved
        );

        // Create or update user bet
        let user_bet = &mut ctx.accounts.user_bet;
        user_bet.market = market.key();
        user_bet.agent_pool = ctx.accounts.agent_pool.key();
        user_bet.bettor = ctx.accounts.bettor.key();
        user_bet.amount += amount;
        user_bet.claimed = false;
        user_bet.bump = *ctx.bumps.get("user_bet").unwrap();

        // Transfer tokens to market vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.bettor_token_account.to_account_info(),
            to: ctx.accounts.market_vault.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update pool statistics
        let pool = &mut ctx.accounts.agent_pool;
        if user_bet.amount == amount {
            // New bettor
            pool.bettor_count += 1;
        }
        pool.total_staked += amount;

        // Update market total volume
        let market_mut = &mut ctx.accounts.market;
        market_mut.total_volume += amount;

        // Recalculate implied probabilities for all pools
        pool.implied_probability = if market_mut.total_volume > 0 {
            ((pool.total_staked as f64 / market_mut.total_volume as f64) * 100.0) as u8
        } else {
            0
        };

        emit!(BetPlaced {
            bettor: ctx.accounts.bettor.key(),
            agent: pool.agent,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Bet placed: {} tokens on agent: {}", amount, pool.agent_name);
        Ok(())
    }

    /// Resolve the market with the winning agent
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winner_agent: Pubkey,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        require!(
            !market.is_resolved,
            PredictionMarketError::MarketAlreadyResolved
        );

        require!(
            Clock::get()?.unix_timestamp >= market.market_close_time,
            PredictionMarketError::MarketNotClosed
        );

        market.is_resolved = true;
        market.winner_agent = Some(winner_agent);

        emit!(MarketResolved {
            market: market.key(),
            winner_agent,
            total_volume: market.total_volume,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Market resolved. Winner: {}", winner_agent);
        Ok(())
    }

    /// Claim winnings for a successful bet
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(
            market.is_resolved,
            PredictionMarketError::MarketNotResolved
        );

        require!(
            !user_bet.claimed,
            PredictionMarketError::AlreadyClaimed
        );

        let winning_pool = &ctx.accounts.winning_pool;
        let user_pool = &ctx.accounts.agent_pool;

        require!(
            user_pool.agent == market.winner_agent.unwrap(),
            PredictionMarketError::NotWinner
        );

        // Calculate payout: (user_bet / winning_pool_total) * total_market_volume
        let payout = (user_bet.amount as u128 * market.total_volume as u128
            / winning_pool.total_staked as u128) as u64;

        // Transfer winnings from vault to user
        let market_key = market.key();
        let seeds = &[
            b"market",
            market.arena.as_ref(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_vault.to_account_info(),
            to: ctx.accounts.bettor_token_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, payout)?;

        user_bet.claimed = true;

        emit!(WinningsClaimed {
            bettor: ctx.accounts.bettor.key(),
            agent: winning_pool.agent,
            bet_amount: user_bet.amount,
            payout,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Winnings claimed: {} tokens", payout);
        Ok(())
    }
}

// ========== CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", arena.as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Arena pubkey reference
    pub arena: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_pubkey: Pubkey)]
pub struct CreateAgentPool<'info> {
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = authority,
        space = 8 + AgentPool::INIT_SPACE,
        seeds = [b"pool", market.key().as_ref(), agent_pubkey.as_ref()],
        bump
    )]
    pub agent_pool: Account<'info, AgentPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub agent_pool: Account<'info, AgentPool>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = 8 + UserBet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), agent_pool.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub market: Account<'info, Market>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"market", market.arena.as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    pub agent_pool: Account<'info, AgentPool>,

    pub winning_pool: Account<'info, AgentPool>,

    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), agent_pool.key().as_ref(), bettor.key().as_ref()],
        bump = user_bet.bump,
    )]
    pub user_bet: Account<'info, UserBet>,

    pub bettor: Signer<'info>,

    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ========== ACCOUNTS ==========

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub arena: Pubkey,
    pub total_volume: u64,
    pub market_close_time: i64,
    pub is_resolved: bool,
    pub winner_agent: Option<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentPool {
    pub market: Pubkey,
    pub agent: Pubkey,
    #[max_len(32)]
    pub agent_name: String,
    pub total_staked: u64,
    pub bettor_count: u32,
    pub implied_probability: u8, // 0-100
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBet {
    pub market: Pubkey,
    pub agent_pool: Pubkey,
    pub bettor: Pubkey,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}

// ========== EVENTS ==========

#[event]
pub struct BetPlaced {
    pub bettor: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub winner_agent: Pubkey,
    pub total_volume: u64,
    pub timestamp: i64,
}

#[event]
pub struct WinningsClaimed {
    pub bettor: Pubkey,
    pub agent: Pubkey,
    pub bet_amount: u64,
    pub payout: u64,
    pub timestamp: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum PredictionMarketError {
    #[msg("Market is closed for betting")]
    MarketClosed,
    #[msg("Market is already resolved")]
    MarketResolved,
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market is not closed yet")]
    MarketNotClosed,
    #[msg("Market is not resolved yet")]
    MarketNotResolved,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("Not a winning bet")]
    NotWinner,
}
