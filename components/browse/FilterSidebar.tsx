'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, X, ChevronDown, ChevronUp, MapPin,
  Trophy, Star, DollarSign, Sparkles, RotateCcw,
  Check,
} from 'lucide-react';

interface Filters {
  location: string;
  sport: string;
  priceRange: number[];
  rating: number;
  amenities: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableCities: string[];
  availableSports: string[];
  priceRange: { min: number; max: number };
}

// ─── Collapsible Section ─────────────────────────────────────────────

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-pitchline/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-1 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center text-flood-500">
            {icon}
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">{title}</span>
          {count !== undefined && count > 0 && (
            <Badge className="rounded-[3px] border border-flood-500/40 bg-transparent font-mono text-flood-500 text-[10px] h-5 px-1.5">
              {count}
            </Badge>
          )}
        </div>
        <div className="text-chalk-400 group-hover:text-chalk-100 transition-colors">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {open && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}

// ─── Searchable Chip List ────────────────────────────────────────────

function SearchableChipList({
  items,
  selected,
  onSelect,
  placeholder,
  maxVisible = 6,
  emptyText = 'No items found',
}: {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder: string;
  maxVisible?: number;
  emptyText?: string;
}) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const visible = showAll ? filtered : filtered.slice(0, maxVisible);
  const remaining = filtered.length - maxVisible;

  return (
    <div className="space-y-2.5">
      {items.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-chalk-400/60 h-3.5 w-3.5" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowAll(true);
            }}
            className="pl-8 h-8 text-xs rounded-[3px] border-pitchline bg-pitch-800/70 text-chalk-100 placeholder:text-chalk-400/60 focus:border-flood-500/60"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setShowAll(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-chalk-400/60 hover:text-chalk-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((item) => {
            const isSelected = selected === item;
            return (
              <button
                key={item}
                onClick={() => onSelect(isSelected ? '' : item)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200 ease-night ${
                  isSelected
                    ? 'bg-flood-500 text-pitch-900 shadow-flood'
                    : 'bg-pitch-800/70 text-chalk-400 hover:text-chalk-100 border border-pitchline hover:border-flood-500/50'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {item}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-chalk-400 text-center py-2">{emptyText}</p>
      )}

      {!search && remaining > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-[11px] text-flood-500 hover:text-flood-600 font-medium transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {remaining} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Price Range Filter ──────────────────────────────────────────────

function PriceRangeFilter({
  value,
  range,
  onChange,
}: {
  value: number[];
  range: { min: number; max: number };
  onChange: (value: number[]) => void;
}) {
  const presets = [
    { label: 'Any', value: [range.min, range.max] },
    { label: '< ₹500', value: [range.min, 500] },
    { label: '₹500–1K', value: [500, 1000] },
    { label: '₹1K–2K', value: [1000, 2000] },
    { label: '₹2K+', value: [2000, range.max] },
  ];

  const isPresetActive = (preset: number[]) =>
    value[0] === preset[0] && value[1] === preset[1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.value)}
            className={`px-2.5 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200 ease-night ${
              isPresetActive(preset.value)
                ? 'bg-flood-500 text-pitch-900 shadow-flood'
                : 'bg-pitch-800/70 text-chalk-400 hover:text-chalk-100 border border-pitchline hover:border-flood-500/50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-chalk-400">₹</span>
          <Input
            type="number"
            value={value[0]}
            onChange={(e) => onChange([Number(e.target.value), value[1]])}
            min={range.min}
            max={value[1]}
            className="pl-5 h-8 font-mono text-xs rounded-[3px] border-pitchline bg-pitch-800/70 text-chalk-100 focus:border-flood-500/60"
            placeholder="Min"
          />
        </div>
        <span className="text-chalk-400/50 text-xs">—</span>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-chalk-400">₹</span>
          <Input
            type="number"
            value={value[1]}
            onChange={(e) => onChange([value[0], Number(e.target.value)])}
            min={value[0]}
            max={range.max}
            className="pl-5 h-8 font-mono text-xs rounded-[3px] border-pitchline bg-pitch-800/70 text-chalk-100 focus:border-flood-500/60"
            placeholder="Max"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-chalk-400">
          ₹{value[0].toLocaleString()} – ₹{value[1].toLocaleString()}
        </span>
        {!isPresetActive([range.min, range.max]) && (
          <button
            onClick={() => onChange([range.min, range.max])}
            className="text-[10px] text-flood-500 hover:text-flood-600 font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Rating Filter ───────────────────────────────────────────────────

function RatingFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const ratings = [
    { label: 'Any', value: 0 },
    { label: '4+', value: 4, stars: 4 },
    { label: '3+', value: 3, stars: 3 },
    { label: '2+', value: 2, stars: 2 },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {ratings.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value === value ? 0 : r.value)}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200 ease-night ${
            value === r.value
              ? 'bg-flood-500 text-pitch-900 shadow-flood'
              : 'bg-pitch-800/70 text-chalk-400 hover:text-chalk-100 border border-pitchline hover:border-flood-500/50'
          }`}
        >
          {r.stars && (
            <Star
              className={`h-3 w-3 ${
                value === r.value ? 'text-pitch-900 fill-pitch-900' : 'text-flood-500 fill-flood-500'
              }`}
            />
          )}
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ─── Amenities Filter ────────────────────────────────────────────────

function AmenitiesFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (amenities: string[]) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const ALL_AMENITIES = [
    'Parking', 'Washroom', 'Drinking Water', 'Changing Room',
    'First Aid', 'Floodlights', 'Seating Area', 'Cafeteria',
    'Wi-Fi', 'Shower', 'Locker', 'Equipment Rental',
  ];

  const maxVisible = 6;
  const visible = showAll ? ALL_AMENITIES : ALL_AMENITIES.slice(0, maxVisible);
  const remaining = ALL_AMENITIES.length - maxVisible;

  const toggle = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {visible.map((amenity) => {
          const isSelected = selected.includes(amenity);
          return (
            <button
              key={amenity}
              onClick={() => toggle(amenity)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200 ease-night ${
                isSelected
                  ? 'bg-flood-500 text-pitch-900 shadow-flood'
                  : 'bg-pitch-800/70 text-chalk-400 hover:text-chalk-100 border border-pitchline hover:border-flood-500/50'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {amenity}
            </button>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-[11px] text-flood-500 hover:text-flood-600 font-medium transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {remaining} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main FilterSidebar (exported) ───────────────────────────────────

export function FilterSidebar({
  filters,
  onFiltersChange,
  availableCities,
  availableSports,
  priceRange,
}: FilterSidebarProps) {
  const activeCount = [
    filters.location,
    filters.sport,
    filters.rating > 0,
    filters.amenities.length > 0,
    filters.priceRange[0] !== priceRange.min || filters.priceRange[1] !== priceRange.max,
  ].filter(Boolean).length;

  const resetAll = () => {
    onFiltersChange({
      location: '',
      sport: '',
      priceRange: [priceRange.min, priceRange.max],
      rating: 0,
      amenities: [],
    });
  };

  return (
    <div className="space-y-1">
      {activeCount > 0 && (
        <div className="flex items-center justify-between px-1 pb-3 border-b border-pitchline/60">
          <Badge className="rounded-[3px] border border-flood-500/40 bg-transparent font-mono text-flood-500 text-[10px] h-5">
            {activeCount} active
          </Badge>
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1 text-[11px] text-chalk-400 hover:text-flood-500 font-medium transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        </div>
      )}

      <FilterSection
        title="Location"
        icon={<MapPin className="h-3.5 w-3.5" />}
        defaultOpen={true}
        count={filters.location ? 1 : 0}
      >
        <SearchableChipList
          items={availableCities}
          selected={filters.location}
          onSelect={(val) => onFiltersChange({ ...filters, location: val })}
          placeholder="Search cities..."
          maxVisible={6}
          emptyText="No cities found"
        />
      </FilterSection>

      <FilterSection
        title="Sports"
        icon={<Trophy className="h-3.5 w-3.5" />}
        defaultOpen={true}
        count={filters.sport ? 1 : 0}
      >
        <SearchableChipList
          items={availableSports}
          selected={filters.sport}
          onSelect={(val) => onFiltersChange({ ...filters, sport: val })}
          placeholder="Search sports..."
          maxVisible={6}
          emptyText="No sports found"
        />
      </FilterSection>

      <FilterSection
        title="Price Range"
        icon={<DollarSign className="h-3.5 w-3.5" />}
        defaultOpen={true}
        count={
          filters.priceRange[0] !== priceRange.min || filters.priceRange[1] !== priceRange.max
            ? 1
            : 0
        }
      >
        <PriceRangeFilter
          value={filters.priceRange}
          range={priceRange}
          onChange={(val) => onFiltersChange({ ...filters, priceRange: val })}
        />
      </FilterSection>

      <FilterSection
        title="Rating"
        icon={<Star className="h-3.5 w-3.5" />}
        defaultOpen={true}
        count={filters.rating > 0 ? 1 : 0}
      >
        <RatingFilter
          value={filters.rating}
          onChange={(val) => onFiltersChange({ ...filters, rating: val })}
        />
      </FilterSection>

      <FilterSection
        title="Amenities"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        defaultOpen={false}
        count={filters.amenities.length}
      >
        <AmenitiesFilter
          selected={filters.amenities}
          onChange={(val) => onFiltersChange({ ...filters, amenities: val as never[] })}
        />
      </FilterSection>
    </div>
  );
}