'use client';

import { useEffect, useRef } from 'react';

interface ElevenLabsWidgetProps {
  agentId?: string;
}

/**
 * ElevenLabs ConvAI Voice Widget
 * Provides voice AI assistant on every page
 */
export function ElevenLabsWidget({ agentId = 'agent_4701kr0frds8eqb9nbbt4a4tdnsy' }: ElevenLabsWidgetProps) {
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
