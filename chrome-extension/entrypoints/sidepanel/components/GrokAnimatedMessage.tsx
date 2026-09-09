// entrypoints/sidepanel/components/GrokAnimatedMessage.tsx
/**
 * Animated Grok message component with cyberpunk styling
 */

import { Paper, Text, Stack, Group, Badge } from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface GrokAnimatedMessageProps {
  message: string;
  isTyping?: boolean;
  citations?: string[];
  className?: string;
}

export default function GrokAnimatedMessage({
  message,
  isTyping = false,
  citations,
  className = "",
}: GrokAnimatedMessageProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(message);
      return;
    }

    if (currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(message.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Typing speed

      return () => clearTimeout(timer);
    }
  }, [message, isTyping, currentIndex]);

  return (
    <Paper
      className={`grok-message-container ${isTyping ? "typing" : ""} ${className}`}
      p="md"
      style={{
        background: "rgba(26, 26, 37, 0.8)",
        border: "1px solid rgba(153, 69, 255, 0.3)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack gap="sm">
        <Group gap="xs" align="center">
          <IconRobot
            size={20}
            style={{
              color: "#14F195",
              filter: "drop-shadow(0 0 8px rgba(20, 241, 149, 0.6))",
              animation: "grok-pulse 2s infinite",
            }}
          />
          <Text
            size="xs"
            fw={600}
            style={{
              background: "linear-gradient(135deg, #14F195, #9945FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            GROK
          </Text>
        </Group>

        <Text
          size="sm"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#f0f0f5",
            lineHeight: 1.6,
          }}
        >
          {displayedText}
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                backgroundColor: "#14F195",
                marginLeft: "2px",
                animation: "blink 1s infinite",
                boxShadow: "0 0 8px rgba(20, 241, 149, 0.8)",
              }}
            />
          )}
        </Text>

        {citations && citations.length > 0 && (
          <Group gap="xs" mt="xs">
            <Text size="xs" c="dimmed">
              Sources:
            </Text>
            {citations.slice(0, 3).map((citation, idx) => (
              <Badge
                key={idx}
                size="xs"
                variant="light"
                component="a"
                href={citation}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "rgba(153, 69, 255, 0.2)",
                  border: "1px solid rgba(153, 69, 255, 0.4)",
                  color: "#9945FF",
                }}
              >
                {new URL(citation).hostname}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
