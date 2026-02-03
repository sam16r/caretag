import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { debounce } from '@/lib/utils';

interface DrugSuggestion {
  brandName: string;
  genericName: string;
  manufacturer: string;
}

interface DrugValidationResult {
  valid: boolean;
  suggestions: DrugSuggestion[];
  totalResults: number;
  message: string;
}

export function useDrugValidation(drugName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['drug-validation', drugName],
    queryFn: async (): Promise<DrugValidationResult> => {
      if (!drugName || drugName.trim().length < 2) {
        return { valid: false, suggestions: [], totalResults: 0, message: '' };
      }

      const { data, error } = await supabase.functions.invoke('validate-drug', {
        body: { drugName: drugName.trim() }
      });

      if (error) {
        console.error('Drug validation error:', error);
        throw error;
      }

      return data as DrugValidationResult;
    },
    enabled: enabled && drugName.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}

export function useDrugSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounced search term update
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedTerm(value);
    }, 500),
    []
  );

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  };

  const validation = useDrugValidation(debouncedTerm, debouncedTerm.length >= 2);

  return {
    searchTerm,
    updateSearch,
    ...validation,
    isSearching: validation.isLoading && debouncedTerm.length >= 2,
  };
}
