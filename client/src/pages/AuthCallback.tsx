'use client';

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The Phantom SDK handles the OAuth callback automatically
        // We just need to wait a moment and redirect
        setMessage('Completing wallet connection...');
        
        // Give the SDK time to process the callback
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatus('success');
        setMessage('Successfully connected! Redirecting...');
        
        // Redirect to dashboard after successful auth
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        
        // Redirect to home after error
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background cyber-grid">
      <div className="text-center space-y-6 p-8">
        {/* Animated container */}
        <div className="relative">
          {/* Glowing ring */}
          <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${
            status === 'loading' ? 'bg-primary animate-pulse' :
            status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          }`} />
          
          {/* Icon container */}
          <div className={`relative w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            status === 'loading' ? 'bg-primary/20 border-2 border-primary' :
            status === 'success' ? 'bg-green-500/20 border-2 border-green-500' :
            'bg-red-500/20 border-2 border-red-500'
          }`}>
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <h1 className={`text-2xl font-display font-bold ${
            status === 'loading' ? 'text-primary' :
            status === 'success' ? 'text-green-500' :
            'text-red-500'
          }`}>
            {status === 'loading' ? 'Authenticating' :
             status === 'success' ? 'Connected!' :
             'Connection Failed'}
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Progress bar for loading state */}
        {status === 'loading' && (
          <div className="w-64 mx-auto h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary animate-pulse" 
                 style={{ width: '60%', animation: 'pulse 1s ease-in-out infinite' }} />
          </div>
        )}

        {/* Phantom branding */}
        <div className="pt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <svg className="w-5 h-5" viewBox="0 0 128 128" fill="currentColor">
            <circle cx="64" cy="64" r="64" fill="url(#phantom-gradient)" />
            <defs>
              <linearGradient id="phantom-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#534BB1" />
                <stop offset="100%" stopColor="#551BF9" />
              </linearGradient>
            </defs>
          </svg>
          <span>Powered by Phantom</span>
        </div>
      </div>
    </div>
  );
}
