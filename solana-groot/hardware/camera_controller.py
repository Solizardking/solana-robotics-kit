#!/usr/bin/env python3
"""Camera controller for chart capture."""

import numpy as np
import logging

logger = logging.getLogger('camera-controller')


class CameraController:
    """Control camera for chart capture."""

    def __init__(self, index: int = 0):
        self.index = index

    async def capture(self) -> np.ndarray:
        """Capture camera frame."""
        logger.debug("Camera frame captured")
        # Return dummy 1080p frame
        return np.zeros((1080, 1920, 3), dtype=np.uint8)
