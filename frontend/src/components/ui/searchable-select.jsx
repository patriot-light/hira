import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SearchableSelect = ({
  options = [],
  value = "",
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
  const [menuRect, setMenuRect] = React.useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 224,
  });
  const rootRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const triggerRef = React.useRef(null);

  const selectedOption = React.useMemo(
    () => options.find((option) => getOptionValue(option) === value),
    [getOptionValue, options, value],
  );

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(normalizedQuery),
    );
  }, [getOptionLabel, options, query]);

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const desiredMaxHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      140,
      Math.min(desiredMaxHeight, openUp ? spaceAbove : spaceBelow),
    );

    setMenuRect({
      top: openUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, query, updateMenuPosition]);

  React.useEffect(() => {
    if (!open) return undefined;
    const update = () => updateMenuPosition();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, { capture: true });
    };
  }, [open, updateMenuPosition]);

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

  const chooseOption = (option) => {
    onChange?.(getOptionValue(option));
    setQuery("");
    setOpen(false);
  };

  const menu =
    open && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            className="z-[9999] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
            }}
          >
            <div className="border-b p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  placeholder={searchPlaceholder || placeholder}
                  className="ps-9"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto p-1" style={{ maxHeight: menuRect.maxHeight - 58 }}>
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const optionValue = getOptionValue(option);
                  const selected = optionValue === value;
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        selected && "bg-muted",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseOption(option)}
                    >
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={className}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-11 w-full justify-start bg-white/85 px-3 font-normal"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
      </Button>
      {menu}
    </div>
  );
};

export { SearchableSelect };
