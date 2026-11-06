'use client';

import { useEffect, useRef } from 'react';

interface ElevenLabsWidgetProps {
  agentId?: string;
}

/**
 * ElevenLabs ConvAI Voice Widget
 * Provides voice AI assistant on every page
 */
export function ElevenLabsWidget({ agentId = 'agent_0001kcf3a94bfcm9kj51ss02gnv0' }: ElevenLabsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the custom element dynamically to avoid TypeScript issues
    if (containerRef.current && !containerRef.current.hasChildNodes()) {
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      containerRef.current.appendChild(widget);
    }
  }, [agentId]);

  return <div ref={containerRef} />;
}

export default ElevenLabsWidget;
