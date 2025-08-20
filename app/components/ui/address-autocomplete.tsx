"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useRef, useState } from "react";

interface MapboxFeature {
  properties: {
    address_line1?: string;
    name?: string;
    place?: string;
    postcode?: string;
    address?: string;
    place_name?: string;
    text?: string;
    text_en?: string;
    // Direct address components from Mapbox
    address_level1?: string; // State/Province
    address_level2?: string; // City
    region?: string;
    region_code?: string;
    postal_code?: string;
    context?: Array<{
      id?: string;
      text?: string;
      text_en?: string;
      short_code?: string;
    }> | {
      place?: {
        name?: string;
        text?: string;
      };
      region?: {
        region_code?: string;
        name?: string;
        text?: string;
        short_code?: string;
      };
      postcode?: {
        name?: string;
        text?: string;
      };
      country?: {
        name?: string;
        country_code?: string;
        text?: string;
        short_code?: string;
      };
    };
    // Additional properties that might be at root level
    city?: string;
    state?: string;
    country?: string;
    state_province?: string;
    // Context as array (older Mapbox format)
    context_array?: Array<{
      id: string;
      text: string;
      short_code?: string;
    }>;
  };
  // Some properties might be at feature level
  text?: string;
  text_en?: string;
  place_name?: string;
  context?: Array<{
    id: string;
    text: string;
    text_en?: string;
    short_code?: string;
  }>;
}

interface MapboxRetrieveResponse {
  features: MapboxFeature[];
}

interface AddressAutofillProps {
  accessToken: string;
  onRetrieve: (res: MapboxRetrieveResponse) => void;
  options?: {
    country?: string;
    language?: string;
  };
  children: React.ReactNode;
}

// Dynamically import Mapbox to avoid SSR issues
const AddressAutofill = dynamic<AddressAutofillProps>(
  () => import("@mapbox/search-js-react").then((mod) => mod.AddressAutofill as ComponentType<AddressAutofillProps>),
  {
    ssr: false,
    loading: () => null,
  }
);

interface AddressAutocompleteProps {
  onAddressSelect?: (addressData: AddressData) => void;
  onChange?: (value: string) => void;
  initialValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export interface AddressData {
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  onChange,
  initialValue = "",
  placeholder = "123 Main Street",
  label = "Street Address",
  required = false,
  error,
}: AddressAutocompleteProps) {
  const [value, setValue] = useState(initialValue);
  const [isAutofillActive, setIsAutofillActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleRetrieve = (res: MapboxRetrieveResponse) => {
    console.log("Full Mapbox response:", res); // Debug log
    const feature = res.features[0];
    
    if (!feature) {
      console.log("No feature found in response");
      return;
    }

    const properties = feature.properties;

    if (properties && onAddressSelect) {
      // Extract address - can be in multiple places
      const address = properties.address_line1 || 
                     properties.address || 
                     properties.name || 
                     properties.text || 
                     properties.text_en ||
                     feature.text ||
                     feature.text_en ||
                     "";
      
      // Initialize with direct properties first (most reliable)
      let city = properties.place || properties.city || properties.address_level2 || "";
      let state_province = properties.region || properties.region_code || properties.state || properties.address_level1 || "";
      let postal_code = properties.postcode || properties.postal_code || "";
      let country = properties.country || "";
      
      // Check if context is an array (current Mapbox format)
      if (properties.context && Array.isArray(properties.context)) {
        console.log("Context array:", properties.context);
        
        properties.context.forEach((ctx: { id?: string; text?: string; text_en?: string; short_code?: string }) => {
          if (ctx.id?.startsWith('place.')) {
            city = city || ctx.text || ctx.text_en || "";
          } else if (ctx.id?.startsWith('region.')) {
            // Prefer full state name over abbreviation
            state_province = state_province || ctx.text_en || ctx.text || ctx.short_code || "";
          } else if (ctx.id?.startsWith('postcode.')) {
            postal_code = postal_code || ctx.text || "";
          } else if (ctx.id?.startsWith('country.')) {
            country = country || ctx.text || ctx.text_en || "";
          }
        });
      }
      
      // Alternative: Check feature.context (might be at feature level)
      if (!state_province && feature.context && Array.isArray(feature.context)) {
        feature.context.forEach((ctx) => {
          if (ctx.id.startsWith('place.')) {
            city = city || ctx.text || ctx.text_en || "";
          } else if (ctx.id.startsWith('region.')) {
            state_province = state_province || ctx.text_en || ctx.text || ctx.short_code || "";
          } else if (ctx.id.startsWith('postcode.')) {
            postal_code = postal_code || ctx.text || "";
          } else if (ctx.id.startsWith('country.')) {
            country = country || ctx.text || ctx.text_en || "";
          }
        });
      }
      
      // Parse the place_name as last resort
      if (!state_province || !city || !postal_code) {
        const placeName = properties?.place_name || feature.place_name || "";
        const placeNameParts = placeName.split(", ");
        
        if (placeNameParts.length >= 4) {
          // Format: "address, city, state postal, country"
          city = city || placeNameParts[1] || "";
          
          if (!state_province || !postal_code) {
            // State and postal are usually together like "New Jersey 07730"
            const statePostal = placeNameParts[2] || "";
            const statePostalMatch = statePostal.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
            if (statePostalMatch) {
              state_province = state_province || statePostalMatch[1];
              postal_code = postal_code || statePostalMatch[2];
            } else {
              // No postal code in this part, it's just the state
              state_province = state_province || statePostal;
            }
          }
          
          country = country || placeNameParts[3] || "";
        }
      }
      
      // Normalize country name
      country = normalizeCountryName(country);
      
      // Clean up state abbreviation if needed (remove "US-" prefix)
      if (state_province.startsWith("US-")) {
        state_province = state_province.substring(3);
      }

      const addressData: AddressData = {
        address,
        city,
        state_province,
        postal_code,
        country,
      };

      console.log("Final extracted address data:", addressData);

      // Update the input value with the full address
      setValue(addressData.address);

      // Call the parent callback with parsed data
      onAddressSelect(addressData);
    }
  };

  // Helper function to normalize country names
  const normalizeCountryName = (country: string): string => {
    const countryMap: Record<string, string> = {
      "US": "United States",
      "USA": "United States",
      "United States of America": "United States",
      "CA": "Canada",
      "CAN": "Canada",
      "MX": "Mexico",
      "MEX": "Mexico",
      "México": "Mexico",
    };
    
    return countryMap[country] || country || "United States";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Fallback to regular input if no Mapbox token or not mounted
  if (!accessToken || !isMounted) {
    return (
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={inputRef}
          type="text"
          id="address"
          name="address"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-indigo-500 sm:text-sm"
          required={required}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <AddressAutofill
        accessToken={accessToken}
        onRetrieve={handleRetrieve}
        options={{
          country: "us,ca,mx", // Limit to US, Canada, and Mexico
          language: "en",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          id="address"
          name="address"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsAutofillActive(true)}
          onBlur={() => setTimeout(() => setIsAutofillActive(false), 200)}
          placeholder={placeholder}
          autoComplete="address-line1"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-indigo-500 sm:text-sm"
          required={required}
        />
      </AddressAutofill>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {isAutofillActive && (
        <p className="mt-1 text-xs text-gray-500">Start typing to see address suggestions</p>
      )}
    </div>
  );
}