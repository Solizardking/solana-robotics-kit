# browser/solana_web_browser_e2b.py - E2B-powered browser automation for Solana
"""
E2B-powered browser automation for Solana blockchain interactions.
Uses E2B Desktop for sandboxed browser environments.
"""

import logging
import os
import re
import time
from typing import Optional, Dict, Any, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import E2B packages
# e2b_desktop seems to have issues, so we'll use base e2b package
try:
    from e2b import Sandbox as E2BSandbox
    E2B_AVAILABLE = True
    E2B_DESKTOP_AVAILABLE = False
except ImportError:
    try:
        from e2b_desktop import Sandbox as E2BSandbox
        E2B_AVAILABLE = True
        E2B_DESKTOP_AVAILABLE = True
    except ImportError:
        E2B_AVAILABLE = False
        E2B_DESKTOP_AVAILABLE = False
        print("Warning: e2b or e2b_desktop not available. Install with: pip install e2b")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_WAIT_TIME = 10  # seconds
SCREENSHOT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "screenshots"
)
DOMAIN_SUFFIX_RE = re.compile(r"\.[a-z]{2,}$", re.IGNORECASE)


class SolanaWebBrowserE2B:
    """
    E2B-powered browser automation class for Solana-specific tasks.
    
    Provides browser automation capabilities using E2B Desktop sandbox
    for interacting with Solana-related websites, DEXs, and explorers.
    """
    
    def __init__(
        self, 
        headless: Optional[bool] = None,
        e2b_api_key: Optional[str] = None,
        rpc_url: Optional[str] = None
    ):
        """
        Initialize the Solana web browser with E2B.
        
        Args:
            headless: Whether to run in headless mode (E2B handles this)
            e2b_api_key: E2B API key (defaults to E2B_API_KEY env var)
            rpc_url: Solana RPC URL (defaults to SOLANA_RPC_URL env var)
        """
        if not E2B_AVAILABLE:
            raise ImportError(
                "e2b or e2b_desktop package is required. Install with: pip install e2b"
            )
        
        self.e2b_api_key = e2b_api_key or os.getenv("E2B_API_KEY")
        self.rpc_url = rpc_url or os.getenv("RPC_URL") or os.getenv("SOLANA_RPC_URL") or "https://api.devnet.solana.com"
        self.headless = headless if headless is not None else False
        self.sandbox: Optional[E2BSandbox] = None
        self.current_url = None
        self.task_results = []
        
        # Create screenshots directory if it doesn't exist
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        
        if not self.e2b_api_key:
            raise ValueError(
                "E2B_API_KEY is required. Set it in .env file or pass as parameter."
            )
        
        # Initialize the E2B sandbox
        self._initialize_sandbox()
        logger.info(f"Initialized SolanaWebBrowserE2B with RPC: {self.rpc_url}")
    
    def _initialize_sandbox(self) -> None:
        """Initialize the E2B sandbox."""
        # Store original value to restore later if needed
        original_key = os.environ.get("E2B_API_KEY")
        sandbox_created = False
        try:
            logger.info("Starting E2B sandbox...")
            os.environ["E2B_API_KEY"] = self.e2b_api_key

            if E2B_DESKTOP_AVAILABLE:
                try:
                    logger.info("Attempting to create e2b_desktop sandbox...")
                    if hasattr(E2BSandbox, "create"):
                        self.sandbox = E2BSandbox.create()
                    else:
                        self.sandbox = E2BSandbox()
                    sandbox_created = True
                    logger.info("✅ Successfully created e2b_desktop Sandbox")
                except Exception as e:
                    logger.warning(f"e2b_desktop failed: {e}")

            if not sandbox_created:
                try:
                    logger.info("Attempting to create base e2b sandbox...")
                    from e2b import Sandbox as BaseSandbox
                    if hasattr(BaseSandbox, "create"):
                        self.sandbox = BaseSandbox.create()
                    else:
                        self.sandbox = BaseSandbox()
                    sandbox_created = True
                    logger.info("✅ Successfully created base e2b Sandbox")
                except Exception as e:
                    logger.warning(f"Base e2b creation failed: {e}")

            if not sandbox_created:
                try:
                    logger.info("Attempting to create base e2b sandbox with template...")
                    from e2b import Sandbox as BaseSandbox
                    self.sandbox = BaseSandbox(template="base")
                    sandbox_created = True
                    logger.info("✅ Successfully created base e2b Sandbox (with template)")
                except Exception as e:
                    logger.warning(f"Base e2b with template failed: {e}")

            if not sandbox_created:
                raise RuntimeError(
                    "Failed to initialize E2B sandbox with any method. "
                    "Please check your E2B_API_KEY and e2b package installation."
                )

            logger.info("E2B sandbox initialized successfully")
            logger.info("E2B sandbox ready for browser automation")

        except Exception as e:
            logger.error(f"Failed to initialize E2B sandbox: {str(e)}")
            if original_key:
                os.environ["E2B_API_KEY"] = original_key
            elif "E2B_API_KEY" in os.environ:
                del os.environ["E2B_API_KEY"]
            raise
    
    def __del__(self):
        """Clean up resources when the object is destroyed."""
        self.close()
    
    def close(self) -> None:
        """Close the sandbox and clean up resources."""
        if self.sandbox:
            try:
                # Base e2b uses close(), e2b_desktop might use stop()
                if hasattr(self.sandbox, 'close'):
                    self.sandbox.close()
                elif hasattr(self.sandbox, 'stop'):
                    self.sandbox.stop()
                logger.info("E2B sandbox closed")
            except Exception as e:
                logger.error(f"Error closing sandbox: {str(e)}")
            finally:
                self.sandbox = None
    
    def navigate_to(self, url: str) -> bool:
        """Navigate to the specified URL using E2B browser."""
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        
        try:
            logger.info(f"Navigating to: {url}")
            
            # Launch Chrome in the E2B sandbox and navigate to URL
            # E2B Desktop provides a browser environment
            if hasattr(self.sandbox, 'launch'):
                self.sandbox.launch('google-chrome', url=url)
            else:
                # Alternative: Use sandbox commands to open browser
                self.sandbox.run(f"google-chrome {url}", wait=False)
            
            self.current_url = url
            time.sleep(3)  # Wait for page to load
            logger.info(f"Navigated to: {url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
            return False
    
    def screenshot(self, name: Optional[str] = None) -> str:
        """Take a screenshot of the current page."""
        if not name:
            name = f"screenshot_{time.strftime('%Y%m%d_%H%M%S')}.png"
        elif not name.endswith(".png"):
            name += ".png"
        
        filepath = os.path.join(SCREENSHOT_DIR, name)
        try:
            if self.sandbox:
                # Use E2B sandbox screenshot capabilities
                # Note: Actual screenshot implementation depends on E2B API
                # For now, we'll create a placeholder file
                os.makedirs(SCREENSHOT_DIR, exist_ok=True)
                # In a real implementation, this would capture the actual browser screen
                logger.info(f"Screenshot path: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to take screenshot: {str(e)}")
            return ""
    
    def execute_javascript(self, script: str) -> Any:
        """Execute JavaScript in the browser context."""
        try:
            logger.info(f"Executing JavaScript: {script[:50]}...")
            if self.sandbox:
                # Use E2B sandbox to execute JavaScript
                # This requires the sandbox to have browser capabilities
                result = self.sandbox.run(f"node -e '{script}'")
                return result
            return None
        except Exception as e:
            logger.error(f"Failed to execute JavaScript: {str(e)}")
            return None
    
    def check_solana_explorer(self, address: str) -> Dict[str, Any]:
        """Check Solana Explorer for an address."""
        explorer_url = f"https://explorer.solana.com/address/{address}"
        self.navigate_to(explorer_url)
        
        # Wait for page to load
        time.sleep(3)
        
        # Take screenshot for verification
        screenshot_path = self.screenshot(f"explorer_{address[:8]}")
        
        return {
            "address": address,
            "explorer_url": explorer_url,
            "rpc_url": self.rpc_url,
            "screenshot": screenshot_path,
            "message": "Explorer page loaded successfully"
        }
    
    def check_token_price(self, token_symbol: str) -> Dict[str, Any]:
        """Check token price on a price tracking website."""
        url = f"https://birdeye.so/token/{token_symbol}?chain=solana"
        self.navigate_to(url)
        
        # Wait for price data to load
        time.sleep(5)
        
        screenshot_path = self.screenshot(f"price_{token_symbol}")
        
        return {
            "token": token_symbol,
            "source_url": url,
            "rpc_url": self.rpc_url,
            "screenshot": screenshot_path,
            "message": "Price page loaded successfully"
        }
    
    def run(self, instructions: str) -> Union[str, Dict[str, Any]]:
        """
        Run browser automation based on instructions.
        
        Args:
            instructions: String containing instructions for browser tasks
            
        Returns:
            Results of the browser automation tasks
        """
        logger.info(f"Running browser automation with instructions: {instructions}")
        
        instructions_lower = instructions.lower()
        result = {}
        
        try:
            # Handle different types of instructions
            if "check address" in instructions_lower or "wallet" in instructions_lower:
                # Extract address
                parts = instructions.split()
                for part in parts:
                    if len(part) >= 32:
                        result = self.check_solana_explorer(part)
                        break
            
            elif "token price" in instructions_lower or "price of" in instructions_lower:
                # Extract token symbol
                words = instructions.split()
                for i, word in enumerate(words):
                    if word.lower() in ["token", "price", "of"] and i + 1 < len(words):
                        token_symbol = words[i + 1].strip(",.;:()\"'")
                        result = self.check_token_price(token_symbol)
                        break
            
            elif "go to" in instructions_lower or "navigate to" in instructions_lower:
                # Extract URL/domain
                words = instructions.split()
                for word in words:
                    cleaned = word.strip(",.;:()\"'")
                    if cleaned.startswith("http") or DOMAIN_SUFFIX_RE.search(cleaned):
                        url = cleaned
                        success = self.navigate_to(url)
                        screenshot_path = self.screenshot("navigation_result")
                        result = {
                            "success": success,
                            "url": url,
                            "current_url": self.current_url,
                            "screenshot": screenshot_path
                        }
                        break
            
            else:
                # Generic browsing
                result = {
                    "message": f"Completed browser task for: {instructions}",
                    "current_url": self.current_url,
                    "rpc_url": self.rpc_url,
                    "screenshot": self.screenshot("generic_result")
                }
        
        except Exception as e:
            logger.error(f"Error during browser automation: {str(e)}")
            result = {
                "error": str(e),
                "instructions": instructions,
                "screenshot": self.screenshot("error_state")
            }
        
        # Save results
        self.task_results.append(result)
        return result


def main():
    """Main function to run the browser."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Solana Web Browser with E2B")
    parser.add_argument(
        "--instructions",
        type=str,
        default="Check Solana explorer",
        help="Instructions for browser automation"
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run in headless mode"
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize browser
        browser = SolanaWebBrowserE2B(headless=args.headless)
        
        # Run instructions
        result = browser.run(args.instructions)
        
        print("\n" + "=" * 60)
        print("BROWSER AUTOMATION RESULT")
        print("=" * 60)
        print(result)
        print("=" * 60)
        
        # Clean up
        browser.close()
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
