'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Search, X, Loader2, ExternalLink, Twitter } from 'lucide-react';

interface XSearchBarProps {
  className?: string;
}

export function XSearchBar({ className = '' }: XSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    content: string;
    citations: string[];
    sourcesUsed: number;
  } | null>(null);

  const searchMutation = trpc.grok.searchX.useMutation();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      const result = await searchMutation.mutateAsync({
        query: query.trim(),
        maxResults: 20,
      });

      if (result.success) {
        setResults({
          content: result.content || '',
          citations: result.citations || [],
          sourcesUsed: result.sourcesUsed || 0,
        });
        setIsOpen(true);
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch (error) {
      toast.error('Failed to search X');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const closeResults = () => {
    setIsOpen(false);
    setResults(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search X (Twitter)..."
            className="pl-10 pr-4 h-9 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={searchMutation.isPending}
          className="h-9 px-3"
        >
          {searchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Results Dropdown */}
      {isOpen && results && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              X Search Results
              <span className="text-xs text-muted-foreground">
                ({results.sourcesUsed} sources)
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={closeResults} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-[300px]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {results.content}
                </p>
              </div>
              
              {results.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {results.citations.slice(0, 5).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {new URL(url).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default XSearchBar;
