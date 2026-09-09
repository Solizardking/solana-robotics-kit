#!/usr/bin/env python3
"""Display controller for touchscreen."""

import logging
logger = logging.getLogger('display-controller')


class DisplayController:
    """Control touchscreen display."""

    def __init__(self, port: str = "/dev/fb0"):
        self.port = port

    async def update(self, content):
        """Update display content."""
        logger.debug(f"Display updated: {content}")

    async def clear(self):
        """Clear display."""
        logger.info("Display cleared")
