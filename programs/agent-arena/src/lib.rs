use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AGNTarena11111111111111111111111111111111111");

#[program]
pub mod agent_arena {
    use super::*;

    /// Initialize the Agent Arena
    pub fn initialize_arena(
        ctx: Context<InitializeArena>,
        entry_fee: u64,
        competition_duration: i64,
        prize_pool_distribution: [u8; 3], // [1st, 2nd, 3rd] percentages
    ) -> Result<()> {
        let arena = &mut ctx.accounts.arena;
        arena.authority = ctx.accounts.authority.key();
        arena.entry_fee = entry_fee;
        arena.total_prize_pool = 0;
        arena.competition_start = Clock::get()?.unix_timestamp;
        arena.competition_end = arena.competition_start + competition_duration;
        arena.prize_distribution = prize_pool_distribution;
        arena.agent_count = 0;
        arena.is_active = true;
        arena.bump = *ctx.bumps.get("arena").unwrap();

        msg!("Agent Arena initialized with entry fee: {} lamports", entry_fee);
        Ok(())
    }

    /// Register an agent to compete in the arena
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_name: String,
        agent_type: AgentType,
        model: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.arena.is_active,
            ArenaError::ArenaInactive
        );

        require!(
            agent_name.len() <= 32,
            ArenaError::NameTooLong
        );

        let agent = &mut ctx.accounts.agent_account;
        agent.arena = ctx.accounts.arena.key();
        agent.owner = ctx.accounts.owner.key();
        agent.name = agent_name.clone();
        agent.agent_type = agent_type;
        agent.model = model;
        agent.starting_capital = 10_000_000_000; // 10,000 USDC (6 decimals)
        agent.current_capital = agent.starting_capital;
        agent.trades_executed = 0;
        agent.profitable_trades = 0;
        agent.total_pnl = 0;
        agent.roi_percentage = 0;
        agent.sharpe_ratio = 0;
        agent.max_drawdown = 0;
        agent.is_active = true;
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.bump = *ctx.bumps.get("agent_account").unwrap();

        // Transfer entry fee to prize pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.prize_pool_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, ctx.accounts.arena.entry_fee)?;

        // Update arena state
        let arena = &mut ctx.accounts.arena;
        arena.agent_count += 1;
        arena.total_prize_pool += ctx.accounts.arena.entry_fee;

        msg!("Agent {} registered to arena", agent_name);
        Ok(())
    }

    /// Record a trade execution for an agent
    pub fn record_trade(
        ctx: Context<RecordTrade>,
        trade_type: TradeType,
        entry_price: u64,
        exit_price: u64,
        position_size: u64,
        pnl: i64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_account;

        require!(
            agent.is_active,
            ArenaError::AgentInactive
        );

        require!(
            ctx.accounts.arena.is_active,
            ArenaError::ArenaInactive
        );

        // Update agent statistics
        agent.trades_executed += 1;

        if pnl > 0 {
            agent.profitable_trades += 1;
        }

        // Update P&L
        agent.total_pnl += pnl;
        agent.current_capital = (agent.starting_capital as i64 + agent.total_pnl) as u64;

        // Calculate ROI
        agent.roi_percentage = ((agent.total_pnl as f64 / agent.starting_capital as f64) * 100.0) as i32;

        // Update max drawdown
        let current_drawdown = agent.starting_capital as i64 - agent.current_capital as i64;
        if current_drawdown > agent.max_drawdown {
            agent.max_drawdown = current_drawdown;
        }

        // Emit trade event
        emit!(TradeExecuted {
            agent: agent.key(),
            trade_type,
            entry_price,
            exit_price,
            position_size,
            pnl,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Trade recorded for agent: {} | P&L: {} | Total Trades: {}",
             agent.name, pnl, agent.trades_executed);
        Ok(())
    }

    /// Update agent performance metrics (called periodically)
    pub fn update_metrics(
        ctx: Context<UpdateMetrics>,
        sharpe_ratio: i32,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_account;
        agent.sharpe_ratio = sharpe_ratio;

        msg!("Metrics updated for agent: {} | Sharpe: {}", agent.name, sharpe_ratio);
        Ok(())
    }

    /// Finalize competition and distribute prizes
    pub fn finalize_competition(ctx: Context<FinalizeCompetition>) -> Result<()> {
        let arena = &mut ctx.accounts.arena;

        require!(
            Clock::get()?.unix_timestamp >= arena.competition_end,
            ArenaError::CompetitionNotEnded
        );

        require!(
            arena.is_active,
            ArenaError::ArenaInactive
        );

        arena.is_active = false;

        msg!("Competition finalized. Total prize pool: {}", arena.total_prize_pool);
        Ok(())
    }

    /// Claim prize for winning agent
    pub fn claim_prize(
        ctx: Context<ClaimPrize>,
        position: u8, // 1 = first, 2 = second, 3 = third
    ) -> Result<()> {
        let arena = &ctx.accounts.arena;

        require!(
            !arena.is_active,
            ArenaError::CompetitionNotFinalized
        );

        require!(
            position >= 1 && position <= 3,
            ArenaError::InvalidPosition
        );

        // Calculate prize amount
        let prize_percentage = arena.prize_distribution[(position - 1) as usize] as u64;
        let prize_amount = (arena.total_prize_pool * prize_percentage) / 100;

        // Transfer prize from pool to winner
        let arena_key = arena.key();
        let seeds = &[
            b"arena",
            arena_key.as_ref(),
            &[arena.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.prize_pool_account.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: ctx.accounts.arena.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, prize_amount)?;

        msg!("Prize claimed: {} lamports for position {}", prize_amount, position);
        Ok(())
    }
}

// ========== CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeArena<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Arena::INIT_SPACE,
        seeds = [b"arena", authority.key().as_ref()],
        bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_name: String)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub arena: Account<'info, Arena>,

    #[account(
        init,
        payer = owner,
        space = 8 + AgentAccount::INIT_SPACE,
        seeds = [b"agent", arena.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub prize_pool_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordTrade<'info> {
    pub arena: Account<'info, Arena>,

    #[account(
        mut,
        seeds = [b"agent", arena.key().as_ref(), owner.key().as_ref()],
        bump = agent_account.bump,
    )]
    pub agent_account: Account<'info, AgentAccount>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMetrics<'info> {
    #[account(
        mut,
        seeds = [b"agent", arena.key().as_ref(), owner.key().as_ref()],
        bump = agent_account.bump,
    )]
    pub agent_account: Account<'info, AgentAccount>,

    pub arena: Account<'info, Arena>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeCompetition<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub arena: Account<'info, Arena>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(
        seeds = [b"arena", arena.authority.as_ref()],
        bump = arena.bump,
    )]
    pub arena: Account<'info, Arena>,

    #[account(mut)]
    pub prize_pool_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    pub winner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ========== ACCOUNTS ==========

#[account]
#[derive(InitSpace)]
pub struct Arena {
    pub authority: Pubkey,
    pub entry_fee: u64,
    pub total_prize_pool: u64,
    pub competition_start: i64,
    pub competition_end: i64,
    #[max_len(3)]
    pub prize_distribution: [u8; 3], // [60, 30, 10] = 60% first, 30% second, 10% third
    pub agent_count: u32,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentAccount {
    pub arena: Pubkey,
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub agent_type: AgentType,
    #[max_len(32)]
    pub model: String,
    pub starting_capital: u64,
    pub current_capital: u64,
    pub trades_executed: u32,
    pub profitable_trades: u32,
    pub total_pnl: i64,
    pub roi_percentage: i32,
    pub sharpe_ratio: i32,
    pub max_drawdown: i64,
    pub is_active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

// ========== ENUMS ==========

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum AgentType {
    Analyst,
    Researcher,
    Trader,
    RiskManager,
    Executor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TradeType {
    Long,
    Short,
}

// ========== EVENTS ==========

#[event]
pub struct TradeExecuted {
    pub agent: Pubkey,
    pub trade_type: TradeType,
    pub entry_price: u64,
    pub exit_price: u64,
    pub position_size: u64,
    pub pnl: i64,
    pub timestamp: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ArenaError {
    #[msg("Arena is not active")]
    ArenaInactive,
    #[msg("Agent is not active")]
    AgentInactive,
    #[msg("Competition has not ended yet")]
    CompetitionNotEnded,
    #[msg("Competition not finalized")]
    CompetitionNotFinalized,
    #[msg("Agent name too long (max 32 characters)")]
    NameTooLong,
    #[msg("Invalid position (must be 1, 2, or 3)")]
    InvalidPosition,
}
