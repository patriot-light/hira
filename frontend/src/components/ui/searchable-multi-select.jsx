import * as React from "react";
import { Check, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SearchableMultiSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  getOptionLabel = (option) => option.name,
  getOptionValue = (option) => option.id,
  disabled = false,
  className,
}) => {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const selectedSet = React.useMemo(
    () => new Set(selectedValues || []),
    [selectedValues],
  );

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selectedSet.has(getOptionValue(option))),
    [getOptionValue, options, selectedSet],
  );

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(normalizedQuery),
    );
  }, [getOptionLabel, options, query]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    const value = getOptionValue(option);
    const nextValues = selectedSet.has(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value];
    onChange?.(nextValues);
    setQuery("");
    setOpen(true);
  };

  const removeValue = (value) => {
    onChange?.(
      selectedValues.filter((selectedValue) => selectedValue !== value),
    );
  };

  const menu =
    open && !disabled ? (
      <div
        ref={menuRef}
        className="absolute start-0 top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const value = getOptionValue(option);
            const selected = selectedSet.has(value);
            return (
              <button
                key={value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selected && "bg-muted",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option)}>
                <span className="truncate">{getOptionLabel(option)}</span>
                {selected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative space-y-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          disabled={disabled}
          placeholder={selectedOptions.length ? searchPlaceholder : placeholder}
          className="ps-9"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => {
            const value = getOptionValue(option);
            return (
              <Badge key={value} variant="secondary" className="gap-1 pe-1">
                <span>{getOptionLabel(option)}</span>
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-background/70"
                  onClick={() => removeValue(value)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {menu}
    </div>
  );
};

export { SearchableMultiSelect };
