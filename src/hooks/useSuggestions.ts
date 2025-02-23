import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { logger } from '../utils/logger';

interface UseSuggestionsProps {
  type: 'mention' | 'tag';
  searchTerm: string;
  suggestions?: string[];
}

export function useSuggestions({ type, searchTerm, suggestions = [] }: UseSuggestionsProps) {
  const [matches, setMatches] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearch) {
      setMatches([]);
      return;
    }

    const filtered = suggestions.filter(item =>
      item.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    setMatches(filtered);
    logger.info(`${type} suggestions updated`, { count: filtered.length });
  }, [debouncedSearch, suggestions, type]);

  return matches;
}
