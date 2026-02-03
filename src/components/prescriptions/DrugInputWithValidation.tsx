import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { useDrugValidation } from '@/hooks/useDrugValidation';
import { cn } from '@/lib/utils';

interface DrugSuggestion {
  brandName: string;
  genericName: string;
  manufacturer: string;
}

interface DrugInputWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
}

export function DrugInputWithValidation({ 
  value, 
  onChange,
  onValidationChange,
  placeholder = "Medication name",
  className 
}: DrugInputWithValidationProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState('');

  // Debounce the input value for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Sync with parent value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const { data, isLoading, isFetching } = useDrugValidation(debouncedValue, debouncedValue.length >= 2);

  // Report validation status to parent
  useEffect(() => {
    if (onValidationChange && data) {
      onValidationChange(data.valid === true);
    }
  }, [data, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    // Reset validation when typing
    if (onValidationChange && newValue !== inputValue) {
      onValidationChange(false);
    }
  };

  const handleSuggestionClick = (suggestion: DrugSuggestion) => {
    const selectedName = suggestion.brandName || suggestion.genericName;
    setInputValue(selectedName);
    onChange(selectedName);
    setShowSuggestions(false);
    // Mark as valid when selecting from suggestions
    if (onValidationChange) {
      onValidationChange(true);
    }
  };

  const isValidating = isLoading || isFetching;
  const hasValidationResult = data && debouncedValue.length >= 2;
  const isValid = data?.valid === true;
  const hasSuggestions = (data?.suggestions?.length || 0) > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className={cn(
            className,
            isValid && 'border-green-500 focus-visible:ring-green-500/20',
            hasValidationResult && !isValid && hasSuggestions && 'border-yellow-500 focus-visible:ring-yellow-500/20',
            hasValidationResult && !isValid && !hasSuggestions && 'border-destructive focus-visible:ring-destructive/20'
          )}
        />
        
        {/* Status indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isValidating && debouncedValue.length >= 2 && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isValidating && isValid && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {!isValidating && hasValidationResult && !isValid && !hasSuggestions && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          {!isValidating && hasValidationResult && !isValid && hasSuggestions && (
            <Search className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && hasSuggestions && !isValid && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2 text-xs text-muted-foreground border-b">
            {data?.message || 'Select a drug from FDA database'}
          </div>
          {data?.suggestions?.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex flex-col gap-0.5"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="font-medium text-sm">
                {suggestion.brandName || suggestion.genericName}
              </span>
              {suggestion.brandName && suggestion.genericName && (
                <span className="text-xs text-muted-foreground">
                  Generic: {suggestion.genericName}
                </span>
              )}
              {suggestion.manufacturer && (
                <span className="text-xs text-muted-foreground truncate">
                  {suggestion.manufacturer}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Validation message */}
      {hasValidationResult && !isValid && !hasSuggestions && inputValue.length >= 2 && (
        <p className="text-xs text-destructive mt-1">
          Drug not found in FDA database
        </p>
      )}
      
      {isValid && (
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
            FDA Verified
          </Badge>
        </div>
      )}
    </div>
  );
}
