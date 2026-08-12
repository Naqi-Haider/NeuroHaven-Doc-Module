import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface PatientFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  riskFilter: string;
  setRiskFilter: (risk: string) => void;
  recencyFilter: string;
  setRecencyFilter: (recency: string) => void;
  sortOrder: string;
  setSortOrder: (sort: string) => void;
}

export default function PatientFilters({
  searchQuery,
  setSearchQuery,
  riskFilter,
  setRiskFilter,
  recencyFilter,
  setRecencyFilter,
  sortOrder,
  setSortOrder,
}: PatientFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 bg-card border border-border/60 p-4 rounded-card shadow-sm select-none">
      {/* Search Input */}
      <div className="relative sm:col-span-2">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-jade-teal" />
        <Input
          type="text"
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 border-border bg-white text-xs text-jade-dark font-medium placeholder-jade-teal/60 focus-visible:ring-jade-primary/50"
        />
      </div>

      {/* Risk Level Select */}
      <div className="flex flex-col gap-1">
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="h-9 border border-border bg-white text-xs font-semibold text-jade-dark focus:ring-jade-primary/50">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-jade-teal shrink-0" />
              <SelectValue placeholder="Risk Level" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-border">
            <SelectItem value="all" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              All Risk Levels
            </SelectItem>
            <SelectItem value="mild" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Mild Risk
            </SelectItem>
            <SelectItem value="moderate" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Moderate Risk
            </SelectItem>
            <SelectItem value="severe" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Severe Risk
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Last Active Select */}
      <div className="flex flex-col gap-1">
        <Select value={recencyFilter} onValueChange={setRecencyFilter}>
          <SelectTrigger className="h-9 border border-border bg-white text-xs font-semibold text-jade-dark focus:ring-jade-primary/50">
            <SelectValue placeholder="Last Active" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border">
            <SelectItem value="all" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Any Recency
            </SelectItem>
            <SelectItem value="today" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Active Today
            </SelectItem>
            <SelectItem value="week" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Active This Week
            </SelectItem>
            <SelectItem value="month" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Active This Month
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Select */}
      <div className="flex flex-col gap-1">
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="h-9 border border-border bg-white text-xs font-semibold text-jade-dark focus:ring-jade-primary/50">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border">
            <SelectItem value="recent" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Most Recent
            </SelectItem>
            <SelectItem value="alpha" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Alphabetical (A-Z)
            </SelectItem>
            <SelectItem value="score" className="text-xs text-jade-dark font-medium focus:bg-jade-light/30">
              Lowest Score First
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
