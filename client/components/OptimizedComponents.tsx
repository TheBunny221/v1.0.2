import React, { memo, forwardRef, useMemo, useCallback, useState } from "react";
import {
  FixedSizeList as List,
  VariableSizeList,
  areEqual,
} from "react-window";
import { cn } from "../lib/utils";
import {
  useVirtualScrolling,
  useLazyImage,
  useIntersectionObserver,
} from "../hooks/usePerformance";
import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

// Virtual List Component
interface VirtualListItem {
  id: string | number;
  data: any;
}

interface VirtualListProps {
  items: VirtualListItem[];
  itemHeight: number;
  height: number;
  width?: number | string;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    data: VirtualListItem;
  }) => React.ReactElement;
  className?: string;
  overscanCount?: number;
  onScroll?: (scrollTop: number) => void;
}

const VirtualListItem = memo(
  ({
    index,
    style,
    data,
    renderItem,
  }: {
    index: number;
    style: React.CSSProperties;
    data: {
      items: VirtualListItem[];
      renderItem: VirtualListProps["renderItem"];
    };
    renderItem: VirtualListProps["renderItem"];
  }) => {
    const item = data.items[index];
    if (!item) return null;

    return (
      <div style={style}>{data.renderItem({ index, style, data: item })}</div>
    );
  },
  areEqual,
);

VirtualListItem.displayName = "VirtualListItem";

export const VirtualList: React.FC<VirtualListProps> = memo(
  ({
    items,
    itemHeight,
    height,
    width = "100%",
    renderItem,
    className,
    overscanCount = 5,
    onScroll,
  }) => {
    const itemData = useMemo(
      () => ({ items, renderItem }),
      [items, renderItem],
    );

    const handleScroll = useCallback(
      ({ scrollTop }: { scrollTop: number }) => {
        onScroll?.(scrollTop);
      },
      [onScroll],
    );

    return (
      <div className={className}>
        <List
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={overscanCount}
          onScroll={handleScroll}
        >
          {VirtualListItem}
        </List>
      </div>
    );
  },
);

VirtualList.displayName = "VirtualList";

// Lazy Image Component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  fadeIn?: boolean;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = memo(
  ({
    src,
    placeholder,
    fallback,
    loadingComponent,
    errorComponent,
    fadeIn = true,
    className,
    alt = "",
    ...props
  }) => {
    const {
      ref,
      src: imageSrc,
      isLoaded,
      isError,
      isIntersecting,
    } = useLazyImage(src, placeholder);

    if (isError && errorComponent) {
      return <>{errorComponent}</>;
    }

    if (isError && fallback) {
      return <>{fallback}</>;
    }

    if (!isIntersecting && loadingComponent) {
      return (
        <div ref={ref} className={className}>
          {loadingComponent}
        </div>
      );
    }

    if (!isIntersecting) {
      return (
        <div ref={ref} className={cn("bg-gray-100 animate-pulse", className)} />
      );
    }

    return (
      <img
        ref={ref}
        src={imageSrc}
        alt={alt}
        className={cn(
          className,
          fadeIn && isLoaded && "transition-opacity duration-300",
          fadeIn && !isLoaded && "opacity-0",
        )}
        {...props}
      />
    );
  },
);

LazyImage.displayName = "LazyImage";

// Infinite Scroll Component
interface InfiniteScrollProps {
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  loadNextPage: () => void;
  children: React.ReactNode;
  loader?: React.ReactNode;
  className?: string;
  threshold?: number;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = memo(
  ({
    hasNextPage,
    isNextPageLoading,
    loadNextPage,
    children,
    loader,
    className,
    threshold = 0.5,
  }) => {
    const [sentinelRef, isIntersecting] = useIntersectionObserver({
      threshold,
      rootMargin: "100px",
    });

    React.useEffect(() => {
      if (isIntersecting && hasNextPage && !isNextPageLoading) {
        loadNextPage();
      }
    }, [isIntersecting, hasNextPage, isNextPageLoading, loadNextPage]);

    return (
      <div className={className}>
        {children}
        {hasNextPage && (
          <div ref={sentinelRef} className="py-4">
            {isNextPageLoading && (loader || <div>Loading more...</div>)}
          </div>
        )}
      </div>
    );
  },
);

InfiniteScroll.displayName = "InfiniteScroll";

// Optimized Card Grid
interface OptimizedCardGridProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  getItemKey: (item: T, index: number) => string | number;
  minItemHeight?: number;
}

export const OptimizedCardGrid = memo(
  <T,>({
    items,
    renderCard,
    columns = 3,
    gap = 16,
    className,
    getItemKey,
    minItemHeight = 200,
  }: OptimizedCardGridProps<T>) => {
    const memoizedItems = useMemo(() => {
      return items.map((item, index) => ({
        key: getItemKey(item, index),
        item,
        index,
        component: renderCard(item, index),
      }));
    }, [items, renderCard, getItemKey]);

    const gridStyle = useMemo(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        minHeight: `${minItemHeight}px`,
      }),
      [columns, gap, minItemHeight],
    );

    return (
      <div className={className} style={gridStyle}>
        {memoizedItems.map(({ key, component }) => (
          <div key={key}>{component}</div>
        ))}
      </div>
    );
  },
) as <T>(props: OptimizedCardGridProps<T>) => React.ReactElement;

OptimizedCardGrid.displayName = "OptimizedCardGrid";

// Lazy Section Component
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: number;
  className?: string;
  threshold?: number;
}

export const LazySection: React.FC<LazySectionProps> = memo(
  ({ children, fallback, minHeight = 200, className, threshold = 0.1 }) => {
    const [ref, isIntersecting] = useIntersectionObserver({
      threshold,
      rootMargin: "50px",
    });

    return (
      <div
        ref={ref}
        className={className}
        style={{ minHeight: `${minHeight}px` }}
      >
        {isIntersecting
          ? children
          : fallback || <Skeleton className="w-full h-full" />}
      </div>
    );
  },
);

LazySection.displayName = "LazySection";

// Optimized Table Row
interface OptimizedTableRowProps {
  id: string | number;
  data: Record<string, any>;
  columns: Array<{
    key: string;
    render: (value: any, data: Record<string, any>) => React.ReactNode;
  }>;
  isSelected?: boolean;
  onSelect?: (id: string | number) => void;
  className?: string;
}

export const OptimizedTableRow = memo<OptimizedTableRowProps>(
  ({ id, data, columns, isSelected, onSelect, className }) => {
    const handleClick = useCallback(() => {
      onSelect?.(id);
    }, [id, onSelect]);

    const cells = useMemo(() => {
      return columns.map((column) => (
        <td key={column.key} className="px-4 py-2">
          {column.render(data[column.key], data)}
        </td>
      ));
    }, [columns, data]);

    return (
      <tr
        className={cn(
          "hover:bg-gray-50 cursor-pointer",
          isSelected && "bg-blue-50",
          className,
        )}
        onClick={handleClick}
      >
        {cells}
      </tr>
    );
  },
);

OptimizedTableRow.displayName = "OptimizedTableRow";

// Debounced Input Component
interface DebouncedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = memo(
  ({ value, onChange, debounceMs = 300, className, ...props }) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      },
      [onChange, debounceMs],
    );

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <input
        {...props}
        value={localValue}
        onChange={handleChange}
        className={className}
      />
    );
  },
);

DebouncedInput.displayName = "DebouncedInput";

// Memoized List Component
interface MemoizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  className?: string;
  compareItems?: (a: T, b: T) => boolean;
}

const MemoizedListItem = memo(
  ({
    item,
    index,
    renderItem,
  }: {
    item: any;
    index: number;
    renderItem: (item: any, index: number) => React.ReactNode;
  }) => {
    return <>{renderItem(item, index)}</>;
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
    return (
      prevProps.item === nextProps.item && prevProps.index === nextProps.index
    );
  },
);

MemoizedListItem.displayName = "MemoizedListItem";

export const MemoizedList = memo(
  <T,>({ items, renderItem, getItemKey, className }: MemoizedListProps<T>) => {
    const memoizedItems = useMemo(() => {
      return items.map((item, index) => ({
        key: getItemKey(item, index),
        item,
        index,
      }));
    }, [items, getItemKey]);

    return (
      <div className={className}>
        {memoizedItems.map(({ key, item, index }) => (
          <MemoizedListItem
            key={key}
            item={item}
            index={index}
            renderItem={renderItem}
          />
        ))}
      </div>
    );
  },
) as <T>(props: MemoizedListProps<T>) => React.ReactElement;

MemoizedList.displayName = "MemoizedList";

// Progressive Enhancement Component
interface ProgressiveEnhancementProps {
  fallback: React.ReactNode;
  enhanced: React.ReactNode;
  condition?: boolean;
  delay?: number;
}

export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> =
  memo(({ fallback, enhanced, condition = true, delay = 0 }) => {
    const [showEnhanced, setShowEnhanced] = React.useState(
      delay === 0 && condition,
    );

    React.useEffect(() => {
      if (condition && delay > 0) {
        const timer = setTimeout(() => {
          setShowEnhanced(true);
        }, delay);

        return () => clearTimeout(timer);
      } else if (condition && delay === 0) {
        setShowEnhanced(true);
      }
    }, [condition, delay]);

    return <>{showEnhanced ? enhanced : fallback}</>;
  });

ProgressiveEnhancement.displayName = "ProgressiveEnhancement";

// Optimized Select Component
interface OptimizedSelectProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: number;
  virtualizeThreshold?: number;
}

export const OptimizedSelect: React.FC<OptimizedSelectProps> = memo(
  ({
    options,
    value,
    onChange,
    placeholder,
    className,
    maxHeight = 200,
    virtualizeThreshold = 100,
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedOption = options.find((option) => option.value === value);

    const shouldVirtualize = options.length > virtualizeThreshold;

    const handleSelect = useCallback(
      (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
      },
      [onChange],
    );

    const renderOption = useCallback(
      ({
        index,
        style,
        data,
      }: {
        index: number;
        style: React.CSSProperties;
        data: typeof options;
      }) => {
        const option = data[index];
        return (
          <div
            key={option.value}
            style={style}
            className={cn(
              "px-3 py-2 cursor-pointer hover:bg-gray-100",
              option.disabled && "opacity-50 cursor-not-allowed",
              option.value === value && "bg-blue-50",
            )}
            onClick={() => !option.disabled && handleSelect(option.value)}
          >
            {option.label}
          </div>
        );
      },
      [value, handleSelect],
    );

    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOption?.label || placeholder || "Select..."}
        </button>

        {isOpen && (
          <div
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
            style={{ maxHeight }}
          >
            {shouldVirtualize ? (
              <VirtualList
                items={options.map((option, index) => ({
                  id: option.value,
                  data: option,
                }))}
                itemHeight={40}
                height={Math.min(maxHeight, options.length * 40)}
                renderItem={({ data }) =>
                  renderOption({
                    index: options.findIndex(
                      (o) => o.value === data.data.value,
                    ),
                    style: {},
                    data: options,
                  })
                }
              />
            ) : (
              <div style={{ maxHeight, overflowY: "auto" }}>
                {options.map((option, index) =>
                  renderOption({ index, style: {}, data: options }),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

OptimizedSelect.displayName = "OptimizedSelect";
