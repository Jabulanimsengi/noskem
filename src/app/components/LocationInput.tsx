'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { useDebounce } from '@/hooks/useDebounce';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMapMarkerAlt } from 'react-icons/fa';

// The shape of a suggestion from the Nominatim API
interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// The props the component accepts
interface LocationInputProps {
  onLocationSelect: (location: { description: string; lat: number; lng: number } | null) => void;
}

export default function LocationInput({ onLocationSelect }: LocationInputProps) {
  // State for the selected location object
  const [selected, setSelected] = useState<LocationSuggestion | null>(null);
  // State for the text the user is typing
  const [query, setQuery] = useState('');
  
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&addressdetails=1&countrycodes=za`
      );
      const data: LocationSuggestion[] = await response.json();
      setSuggestions(data || []);
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelect = (suggestion: LocationSuggestion | null) => {
    if (!suggestion) {
        onLocationSelect(null);
        setSelected(null);
        setQuery('');
        return;
    };
    
    setSelected(suggestion);
    setQuery(suggestion.display_name); // Update the input text to the full address
    onLocationSelect({
      description: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
  };

  return (
    <Combobox value={selected} onChange={handleSelect}>
      <div className="relative">
        <Combobox.Input
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(item: LocationSuggestion) => item?.display_name || query}
          placeholder="Start typing your address..."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
          autoComplete="off"
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
          <FaMapMarkerAlt className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>
        <AnimatePresence>
          {suggestions.length > 0 && (
            <Combobox.Options
              static
              as={motion.ul}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              {suggestions.map((suggestion) => (
                <Combobox.Option
                  key={suggestion.place_id}
                  value={suggestion}
                  className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 ${ active ? 'bg-brand text-white' : 'text-gray-900'}`}
                >
                  {suggestion.display_name}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </AnimatePresence>
      </div>
    </Combobox>
  );
}