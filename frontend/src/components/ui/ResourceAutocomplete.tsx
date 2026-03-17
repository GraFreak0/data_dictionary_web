import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import { catalogService } from '../../services/catalog'

interface Suggestion {
  value: string
  label: string
  meta?: string
}

interface ResourceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  resourceType: 'schema' | 'table' | 'column' | string
  placeholder?: string
  disabled?: boolean
}

// Module-level cache so repeated modal opens don't re-fetch
const suggestionCache: Record<string, Suggestion[]> = {}

export function ResourceAutocomplete({
  value,
  onChange,
  resourceType,
  placeholder,
  disabled,
}: ResourceAutocompleteProps) {
  const [allOptions, setAllOptions] = useState<Suggestion[]>([])
  const [filtered, setFiltered] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load options once per resource type (cached)
  useEffect(() => {
    if (suggestionCache[resourceType]) {
      setAllOptions(suggestionCache[resourceType])
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        let options: Suggestion[] = []

        if (resourceType === 'schema') {
          const schemas = await catalogService.getSchemas()
          options = schemas.map((s) => ({
            value: s.name,
            label: s.name,
            meta: `${s.table_count ?? 0} tables`,
          }))
        } else if (resourceType === 'table') {
          const schemas = await catalogService.getSchemas()
          const tableArrays = await Promise.all(
            schemas.map((s) =>
              catalogService.getSchemaTables(s.name).then((tables) =>
                tables.map((t) => ({
                  value: t.name,
                  label: t.name,
                  meta: s.name,
                }))
              )
            )
          )
          options = tableArrays.flat()
        } else if (resourceType === 'column') {
          const schemas = await catalogService.getSchemas()
          const colArrays = await Promise.all(
            schemas.map((s) =>
              catalogService.getSchemaTables(s.name).then((tables) =>
                tables.flatMap((t) =>
                  (t.columns ?? []).map((c) => ({
                    value: c.name,
                    label: c.name,
                    meta: `${s.name}.${t.name}`,
                  }))
                )
              )
            )
          )
          options = colArrays.flat()
        }

        if (!cancelled) {
          suggestionCache[resourceType] = options
          setAllOptions(options)
        }
      } catch {
        // Silently fail — the user can still type a free-form value
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [resourceType])

  // Reset field value when resource type changes
  useEffect(() => {
    onChange('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType])

  // Filter suggestions whenever value or options change
  useEffect(() => {
    const q = value.trim().toLowerCase()
    if (!q) {
      setFiltered(allOptions.slice(0, 12))
    } else {
      setFiltered(
        allOptions
          .filter(
            (o) =>
              o.value.toLowerCase().includes(q) ||
              o.label.toLowerCase().includes(q)
          )
          .slice(0, 12)
      )
    }
  }, [value, allOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const showDropdown = isOpen && filtered.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder ?? `Type to search ${resourceType}s...`}
          disabled={disabled}
          autoComplete="off"
          className="input w-full pr-8"
        />

        {/* Right icon: spinner while loading, chevron when idle */}
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
          ) : (
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-xl">
          {filtered.map((s, i) => (
            <button
              key={`${s.value}-${i}`}
              type="button"
              onMouseDown={(e) => {
                // Prevent blur on input so we can still set value
                e.preventDefault()
                onChange(s.value)
                setIsOpen(false)
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-secondary)]"
            >
              <span className="font-mono text-sm text-[var(--text-primary)] truncate">
                {s.label}
              </span>
              {s.meta && (
                <span className="shrink-0 rounded bg-[var(--bg-tertiary,var(--bg-secondary))] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                  {s.meta}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
