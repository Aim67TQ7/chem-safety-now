import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface SDSSearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterCounts?: {
    oshaCompliant: number;
    manualReview: number;
    highQuality: number;
    readable: number;
  } | null;
  isSearching?: boolean;
}

const quickFilters = [
  { value: 'all', label: 'All Documents', key: null },
  { value: 'osha_compliant', label: 'OSHA Compliant', key: 'oshaCompliant' },
  { value: 'manual_review_required', label: 'Needs Review', key: 'manualReview' },
  { value: 'ai_enhanced', label: 'AI Enhanced', key: 'highQuality' }
];

export const SDSSearchFilters = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterCounts,
  isSearching = false
}: SDSSearchFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product name, manufacturer, or CAS number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-11"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const count = filter.key && filterCounts ? filterCounts[filter.key as keyof typeof filterCounts] : null;
          const isActive = filterStatus === filter.value;
          
          return (
            <Button
              key={filter.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterStatusChange(filter.value)}
              className="h-8 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              {filter.label}
              {count !== null && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-4 w-auto min-w-4 px-1 text-xs"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Active filters summary */}
      {(searchTerm || filterStatus !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="ml-1 h-3 w-3 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filterStatus !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Status: {quickFilters.find(f => f.value === filterStatus)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterStatusChange('all')}
                className="ml-1 h-3 w-3 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};