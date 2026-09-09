#!/usr/bin/env python3
"""
Vibe Coder - Natural Language to Trading Strategy Code Generator
Converts plain English descriptions into executable Python trading strategies
"""

import asyncio
import logging
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import os

logger = logging.getLogger('vibe-coder')


@dataclass
class GeneratedStrategy:
    """Generated trading strategy."""
    code: str
    description: str
    confidence: float
    safety_checks: List[str]
    estimated_risk: str  # 'low', 'medium', 'high'
    requires_approval: bool


class VibeCoder:
    """
    Natural language to code generator for trading strategies.

    Converts plain English descriptions like:
    "Buy SOL when RSI drops below 30 and sell when it goes above 70"

    Into executable Python code with proper risk management and safety checks.
    """

    def __init__(
        self,
        agent=None,
        model: str = "gpt-4",
        safety_mode: bool = True,
        auto_approve_threshold: float = 0.9
    ):
        """
        Initialize Vibe Coder.

        Args:
            agent: SolanaGR00TAgent instance for execution
            model: AI model to use for code generation
            safety_mode: Enable safety checks
            auto_approve_threshold: Confidence threshold for auto-approval
        """
        self.agent = agent
        self.model = model
        self.safety_mode = safety_mode
        self.auto_approve_threshold = auto_approve_threshold

        # Initialize AI client
        self._init_ai_client()

        # Strategy templates
        self.templates = self._load_strategy_templates()

        logger.info("Vibe Coder initialized")

    def _init_ai_client(self):
        """Initialize AI client for code generation."""
        try:
            # Try OpenAI first
            import openai
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.ai_client = openai
            self.use_openai = True
            logger.info("Using OpenAI for code generation")
        except ImportError:
            try:
                # Fall back to Anthropic
                import anthropic
                self.ai_client = anthropic.Anthropic(
                    api_key=os.getenv("ANTHROPIC_API_KEY")
                )
                self.use_openai = False
                logger.info("Using Anthropic for code generation")
            except ImportError:
                logger.warning("No AI client available - using templates only")
                self.ai_client = None
                self.use_openai = False

    def _load_strategy_templates(self) -> Dict[str, str]:
        """Load common strategy templates."""
        return {
            "rsi_strategy": """
async def rsi_strategy(agent, period=14, oversold=30, overbought=70):
    '''RSI-based mean reversion strategy.'''
    import talib
    import numpy as np

    # Get price data
    prices = await agent.get_price_history('SOL/USDC', period=period * 3)

    # Calculate RSI
    rsi = talib.RSI(np.array(prices), timeperiod=period)
    current_rsi = rsi[-1]

    # Trading logic
    if current_rsi < oversold:
        await agent.speak(f"RSI at {current_rsi:.1f} - oversold condition")
        analysis = await agent.analyze_chart('SOL/USDC')
        if analysis.signal == 'BUY':
            await agent.execute_trade(analysis)

    elif current_rsi > overbought:
        await agent.speak(f"RSI at {current_rsi:.1f} - overbought condition")
        # Close positions
        for symbol in agent.current_positions:
            await agent.trading_module.close_position(symbol, agent.current_positions[symbol])
""",
            "macd_crossover": """
async def macd_crossover_strategy(agent, fast=12, slow=26, signal=9):
    '''MACD crossover momentum strategy.'''
    import talib
    import numpy as np

    # Get price data
    prices = await agent.get_price_history('SOL/USDC', period=slow * 3)
    prices_array = np.array(prices)

    # Calculate MACD
    macd, signal_line, histogram = talib.MACD(
        prices_array,
        fastperiod=fast,
        slowperiod=slow,
        signalperiod=signal
    )

    # Check for crossover
    if macd[-2] < signal_line[-2] and macd[-1] > signal_line[-1]:
        # Bullish crossover
        await agent.speak("MACD bullish crossover detected")
        analysis = await agent.analyze_chart('SOL/USDC')
        if analysis.confidence > 75:
            await agent.execute_trade(analysis)

    elif macd[-2] > signal_line[-2] and macd[-1] < signal_line[-1]:
        # Bearish crossover
        await agent.speak("MACD bearish crossover detected")
        # Close positions
        for symbol in list(agent.current_positions.keys()):
            await agent.trading_module.close_position(symbol, agent.current_positions[symbol])
""",
            "multi_timeframe": """
async def multi_timeframe_strategy(agent, pair='SOL/USDC'):
    '''Multi-timeframe confluence strategy.'''

    # Analyze multiple timeframes
    timeframes = ['1m', '5m', '15m', '1h']
    analyses = []

    for tf in timeframes:
        analysis = await agent.analyze_chart(pair, timeframe=tf)
        analyses.append(analysis)
        await asyncio.sleep(0.5)  # Rate limit

    # Check for confluence
    buy_signals = sum(1 for a in analyses if a.signal == 'BUY')
    sell_signals = sum(1 for a in analyses if a.signal == 'SELL')

    if buy_signals >= 3:
        await agent.speak(f"Strong buy confluence across {buy_signals} timeframes")
        # Execute with higher confidence
        await agent.execute_trade(analyses[-1])  # Use highest timeframe

    elif sell_signals >= 3:
        await agent.speak(f"Strong sell confluence across {sell_signals} timeframes")
        # Close all positions
        for symbol in list(agent.current_positions.keys()):
            await agent.trading_module.close_position(symbol, agent.current_positions[symbol])
"""
        }

    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> GeneratedStrategy:
        """
        Generate trading strategy code from natural language.

        Args:
            prompt: Natural language description of strategy
            context: Additional context (current pair, page URL, etc.)

        Returns:
            Generated strategy with code and metadata
        """
        logger.info(f"Generating strategy from prompt: {prompt[:100]}...")

        # Check for template matches
        template_match = self._match_template(prompt)
        if template_match:
            return template_match

        # Use AI to generate custom code
        if self.ai_client:
            strategy = await self._generate_with_ai(prompt, context)
        else:
            # Fallback to basic pattern matching
            strategy = self._generate_with_patterns(prompt)

        # Add safety checks
        if self.safety_mode:
            strategy = self._add_safety_checks(strategy)

        # Estimate risk
        strategy.estimated_risk = self._estimate_risk(strategy.code, prompt)

        # Determine if approval required
        strategy.requires_approval = (
            strategy.confidence < self.auto_approve_threshold or
            strategy.estimated_risk == 'high'
        )

        logger.info(f"Generated strategy (confidence: {strategy.confidence:.2%}, risk: {strategy.estimated_risk})")
        return strategy

    def _match_template(self, prompt: str) -> Optional[GeneratedStrategy]:
        """Check if prompt matches a known template."""
        prompt_lower = prompt.lower()

        # RSI strategy
        if 'rsi' in prompt_lower:
            oversold = self._extract_number(prompt, r'below\s+(\d+)', default=30)
            overbought = self._extract_number(prompt, r'above\s+(\d+)', default=70)

            code = self.templates['rsi_strategy']
            code = code.replace('oversold=30', f'oversold={oversold}')
            code = code.replace('overbought=70', f'overbought={overbought}')

            return GeneratedStrategy(
                code=code,
                description=f"RSI strategy: Buy when RSI < {oversold}, Sell when RSI > {overbought}",
                confidence=0.95,
                safety_checks=["Position size limited", "Stop loss included"],
                estimated_risk='low',
                requires_approval=False
            )

        # MACD strategy
        if 'macd' in prompt_lower:
            return GeneratedStrategy(
                code=self.templates['macd_crossover'],
                description="MACD crossover strategy: Buy on bullish crossover, Sell on bearish",
                confidence=0.95,
                safety_checks=["Crossover confirmation", "Position limits"],
                estimated_risk='low',
                requires_approval=False
            )

        # Multi-timeframe
        if 'timeframe' in prompt_lower or 'confluence' in prompt_lower:
            return GeneratedStrategy(
                code=self.templates['multi_timeframe'],
                description="Multi-timeframe confluence: Requires 3+ timeframes to agree",
                confidence=0.92,
                safety_checks=["Multiple timeframe confirmation", "High threshold"],
                estimated_risk='low',
                requires_approval=False
            )

        return None

    async def _generate_with_ai(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> GeneratedStrategy:
        """Generate code using AI model."""

        system_prompt = """You are an expert Python trading strategy developer.
Generate safe, executable Python async code for Solana trading strategies.

Rules:
1. Use async/await
2. Include proper error handling
3. Add position size limits
4. Include stop-loss logic
5. Use the agent object for trading operations
6. Add clear comments
7. Validate inputs

Available agent methods:
- await agent.analyze_chart(pair, timeframe)
- await agent.execute_trade(analysis)
- await agent.speak(text)
- await agent.trading_module.close_position(symbol, position)

Return ONLY the Python function code, no explanations.
"""

        user_prompt = f"""Generate a trading strategy for this description:

{prompt}

Context:
{context or {}}

Generate the complete Python async function."""

        try:
            if self.use_openai:
                response = await asyncio.to_thread(
                    self.ai_client.ChatCompletion.create,
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1500
                )
                code = response.choices[0].message.content
            else:
                response = await asyncio.to_thread(
                    self.ai_client.messages.create,
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1500,
                    messages=[
                        {"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}
                    ]
                )
                code = response.content[0].text

            # Extract code from markdown if present
            code = self._extract_code_from_markdown(code)

            return GeneratedStrategy(
                code=code,
                description=self._generate_description(code, prompt),
                confidence=0.85,
                safety_checks=[],
                estimated_risk='medium',
                requires_approval=True
            )

        except Exception as e:
            logger.error(f"Error generating with AI: {e}")
            return self._generate_with_patterns(prompt)

    def _generate_with_patterns(self, prompt: str) -> GeneratedStrategy:
        """Generate code using pattern matching (fallback)."""

        # Very basic pattern-based generation
        code = """
async def generated_strategy(agent):
    '''Auto-generated strategy - REVIEW BEFORE EXECUTING'''

    # Analyze current market
    analysis = await agent.analyze_chart('SOL/USDC')

    # Execute based on confidence
    if analysis.confidence > 80:
        await agent.speak(f"Signal: {analysis.signal} with {analysis.confidence}% confidence")
        await agent.execute_trade(analysis)
"""

        return GeneratedStrategy(
            code=code,
            description="Basic analysis-based strategy",
            confidence=0.5,
            safety_checks=[],
            estimated_risk='medium',
            requires_approval=True
        )

    def _add_safety_checks(self, strategy: GeneratedStrategy) -> GeneratedStrategy:
        """Add safety checks to generated code."""

        safety_wrapper = f"""
# SAFETY CHECKS ENABLED
async def safe_strategy_wrapper(agent):
    # Check if trading is enabled
    if not agent.is_trading:
        await agent.speak("Trading is disabled. Enable it first.")
        return

    # Position size limits
    max_position_size = 0.05  # 5% of portfolio
    max_total_exposure = 0.25  # 25% total

    try:
{strategy.code}
    except Exception as e:
        await agent.speak(f"Strategy error: {{e}}")
        logger.error(f"Strategy execution error: {{e}}")
"""

        strategy.code = safety_wrapper
        strategy.safety_checks.extend([
            "Trading enabled check",
            "Position size limits",
            "Error handling"
        ])

        return strategy

    def _estimate_risk(self, code: str, prompt: str) -> str:
        """Estimate risk level of strategy."""

        high_risk_keywords = ['market order', 'unlimited', 'no stop', 'all in']
        medium_risk_keywords = ['leverage', 'short', 'margin']

        code_lower = code.lower()
        prompt_lower = prompt.lower()

        # Check for high risk indicators
        if any(kw in code_lower or kw in prompt_lower for kw in high_risk_keywords):
            return 'high'

        # Check for medium risk indicators
        if any(kw in code_lower or kw in prompt_lower for kw in medium_risk_keywords):
            return 'medium'

        return 'low'

    def _generate_description(self, code: str, prompt: str) -> str:
        """Generate human-readable description of strategy."""

        # Try to extract docstring
        docstring_match = re.search(r"'''(.+?)'''", code, re.DOTALL)
        if docstring_match:
            return docstring_match.group(1).strip()

        # Use prompt as fallback
        return f"Strategy: {prompt[:100]}"

    def _extract_code_from_markdown(self, text: str) -> str:
        """Extract code from markdown code blocks."""
        pattern = r"```python\n(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()

    def _extract_number(
        self,
        text: str,
        pattern: str,
        default: int
    ) -> int:
        """Extract number from text using regex pattern."""
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return default

    async def execute(
        self,
        strategy: GeneratedStrategy,
        approved: bool = False
    ) -> Dict[str, Any]:
        """
        Execute generated strategy.

        Args:
            strategy: Generated strategy to execute
            approved: Whether strategy has been manually approved

        Returns:
            Execution result
        """
        if not self.agent:
            return {"error": "No agent available for execution"}

        if strategy.requires_approval and not approved:
            return {
                "error": "Strategy requires manual approval",
                "strategy": strategy
            }

        logger.info("Executing generated strategy...")

        try:
            # Compile code
            exec_globals = {
                'agent': self.agent,
                'asyncio': asyncio,
                'logger': logger
            }

            exec(strategy.code, exec_globals)

            # Find the strategy function
            strategy_func = None
            for name, obj in exec_globals.items():
                if callable(obj) and asyncio.iscoroutinefunction(obj):
                    strategy_func = obj
                    break

            if not strategy_func:
                return {"error": "No executable function found in generated code"}

            # Execute strategy
            result = await strategy_func(self.agent)

            return {
                "success": True,
                "result": result,
                "description": strategy.description
            }

        except Exception as e:
            logger.error(f"Error executing strategy: {e}")
            return {
                "error": str(e),
                "traceback": str(e.__traceback__)
            }


# Example usage
async def main():
    """Example usage of Vibe Coder."""

    coder = VibeCoder()

    # Example prompts
    prompts = [
        "Buy SOL when RSI drops below 30 and sell when it goes above 70",
        "Create a MACD crossover strategy with 12, 26, 9 parameters",
        "Multi-timeframe strategy that requires confluence across 1m, 5m, 15m, and 1h charts"
    ]

    for prompt in prompts:
        print(f"\n{'='*60}")
        print(f"Prompt: {prompt}")
        print('='*60)

        strategy = await coder.generate(prompt)

        print(f"\nDescription: {strategy.description}")
        print(f"Confidence: {strategy.confidence:.1%}")
        print(f"Risk: {strategy.estimated_risk}")
        print(f"Requires Approval: {strategy.requires_approval}")
        print(f"\nGenerated Code:\n{strategy.code}")


if __name__ == "__main__":
    asyncio.run(main())
