import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Reusable & Lightweight Dropdown Component with On-Demand (Lazy) Fetching Support
 *
 * @param {string} value - Selected value
 * @param {function} onChange - Callback when selected value changes
 * @param {Array} options - Static options (array of strings or { value, label } objects)
 * @param {string} defaultLabel - Label for empty/unselected option (e.g. "Semua Kategori Asal")
 * @param {string} fetchUrl - Optional API endpoint to fetch options lazily on user interaction
 * @param {function} transformData - Optional function to parse options from API response
 * @param {string} className - Custom CSS class
 * @param {boolean} disabled - Disable state
 * @param {string} id - HTML ID
 * @param {string} name - HTML Name
 */
const Dropdown = ({
  value = '',
  onChange,
  options = [],
  defaultLabel = 'Pilih Opsi',
  fetchUrl = null,
  transformData = null,
  className = '',
  disabled = false,
  id,
  name
}) => {
  const [dynamicOptions, setDynamicOptions] = useState(options);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const isFetchingRef = useRef(false);

  // Sync with static options prop if provided or changed externally
  useEffect(() => {
    if (options && options.length > 0) {
      setDynamicOptions(options);
    }
  }, [options]);

  // Lazy fetch triggered ONLY when needed
  const triggerFetch = async () => {
    if (!fetchUrl || hasFetched || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const res = await axios.get(fetchUrl);
      
      let parsed = [];
      if (typeof transformData === 'function') {
        parsed = transformData(res);
      } else if (Array.isArray(res.data)) {
        parsed = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        parsed = res.data.data;
      }

      setDynamicOptions(Array.isArray(parsed) ? parsed : []);
      setHasFetched(true);
    } catch (err) {
      console.error(`[Dropdown Error] Failed to fetch options from ${fetchUrl}:`, err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // If a non-empty value is passed on mount (e.g. restored from state/URL), fetch options immediately
  useEffect(() => {
    if (fetchUrl && value && !hasFetched) {
      triggerFetch();
    }
  }, [value, fetchUrl]);

  const handleChange = (e) => {
    const selectedVal = e.target.value;
    if (onChange) onChange(selectedVal);
  };

  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={triggerFetch}
        onMouseEnter={() => {
          // Pre-fetch on hover for instant responsiveness when opened
          if (fetchUrl && !hasFetched) triggerFetch();
        }}
        disabled={disabled || loading}
        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-700 bg-white transition-colors cursor-pointer shadow-2xs disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{loading ? 'Memuat opsi...' : defaultLabel}</option>
        {dynamicOptions.map((opt, idx) => {
          const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
          const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
          return (
            <option key={idx} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default Dropdown;
export { Dropdown };
