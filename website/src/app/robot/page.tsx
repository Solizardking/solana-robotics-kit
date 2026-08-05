'use client';

import SolanaDesktopRobot from '@/components/SolanaDesktopRobot';

export default function RobotPage() {
  return (
    <div className="min-h-screen">
      <SolanaDesktopRobot 
        openvoiceServerUrl={process.env.NEXT_PUBLIC_OPENVOICE_URL || 'http://localhost:5000'}
        onVoiceResponse={(audioUrl) => {
          console.log('Voice response received:', audioUrl);
        }}
      />
    </div>
  );
}
