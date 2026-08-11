import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

export default function MultiSelectFilter({
  label,
  options = [], // Expected format: Array of strings or { label, value, count }
  selectedValues = [],
  onChange,
  placeholder = 'All',
  searchPlaceholder = 'Search...'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Normalizes options to an array of { label, value, count }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt, count: null }
    }
    return {
      label: opt.label || opt.value || '',
      value: opt.value || '',
      count: opt.count !== undefined ? opt.count : null
    }
  })

  // Filter options based on search term
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleOption = (val) => {
    const isSelected = selectedValues.includes(val)
    let newSelected
    if (isSelected) {
      newSelected = selectedValues.filter((v) => v !== val)
    } else {
      newSelected = [...selectedValues, val]
    }
    onChange(newSelected)
  }

  const handleSelectAll = () => {
    // Select all currently visible filtered options
    const visibleValues = filteredOptions.map((o) => o.value)
    const newSelected = Array.from(new Set([...selectedValues, ...visibleValues]))
    onChange(newSelected)
  }

  const handleClearAll = () => {
    // Clear only the visible filtered options from selected values
    const visibleValues = filteredOptions.map((o) => o.value)
    const newSelected = selectedValues.filter((v) => !visibleValues.includes(v))
    onChange(newSelected)
  }

  // Display label on the button
  const getButtonLabel = () => {
    if (selectedValues.length === 0) return placeholder
    if (selectedValues.length === 1) {
      const opt = normalizedOptions.find((o) => o.value === selectedValues[0])
      return opt ? opt.label : selectedValues[0]
    }
    return `${selectedValues.length} Selected`
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 dark:text-zinc-400">
        {label}
      </span>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev
            if (!next) setSearchTerm('')
            return next
          })
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border text-sm rounded-xl text-left transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        } ${selectedValues.length > 0 ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
      >
        <span className="truncate pr-2">{getButtonLabel()}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl shadow-zinc-200/40 dark:shadow-none animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          {/* Search Box */}
          <div className="relative p-2 border-b border-zinc-100 dark:border-zinc-900/60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Links */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/40 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-450 dark:text-zinc-500 italic">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleOption(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group ${
                      isChecked
                        ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/5'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'border-blue-500 bg-blue-600 text-white dark:bg-blue-500'
                            : 'border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {opt.count !== null && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${
                          isChecked
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
