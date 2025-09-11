import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Info } from "lucide-react";

export interface HeatmapData {
  xLabels: string[];
  yLabels: string[];
  matrix: number[][]; // rows = y, cols = x
  xAxisLabel: string;
  yAxisLabel: string;
}

interface HeatmapGridProps {
  title: string;
  description?: string;
  data: HeatmapData;
  className?: string;
}

function getOpacity(value: number, min: number, max: number) {
  if (max <= min) return 0;
  const ratio = (value - min) / (max - min);
  if (value === 0) return 0;
  return Math.max(0.12, Math.min(0.95, ratio * 0.9 + 0.05));
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  title,
  description,
  data,
  className,
}) => {
  const { xLabels, yLabels, matrix, xAxisLabel, yAxisLabel } = data;
  const flat = matrix.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-[260px] text-xs">
                  Hover over any cell to see the exact complaint count.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        {xLabels.length === 0 || yLabels.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No data available for selected filters
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row with rotated/truncated labels and tooltips */}
              <div
                className="grid items-end"
                style={{
                  gridTemplateColumns: `200px repeat(${xLabels.length}, minmax(100px, 1fr))`,
                }}
              >
                <div className="p-3 text-xs font-medium text-right pr-4 flex items-end justify-end">
                  <span className="whitespace-nowrap font-medium">
                    {yAxisLabel}
                  </span>
                </div>
                {xLabels.map((x, xi) => (
                  <div
                    key={xi}
                    className="p-2 text-[11px] md:text-xs font-medium text-muted-foreground text-center"
                    style={{ minHeight: 100, paddingBottom: 12 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full flex items-end justify-center overflow-visible">
                            <span
                              className="max-w-[140px] block text-center whitespace-normal break-words md:inline-block md:max-w-[180px] md:truncate md:-rotate-45"
                              title={x}
                              style={{
                                transformOrigin: "bottom center",
                                display: "inline-block",
                              }}
                            >
                              {x}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs max-w-[300px]">{x}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {yLabels.map((y, yi) => (
                <div
                  key={yi}
                  className="grid"
                  style={{
                    gridTemplateColumns: `160px repeat(${xLabels.length}, minmax(80px, 1fr))`,
                  }}
                >
                  {/* Y label */}
                  <div className="p-2 text-xs text-right pr-3 font-medium text-foreground/80 border-t">
                    {y}
                  </div>
                  {/* Cells */}
                  {xLabels.map((_, xi) => {
                    const v = matrix[yi]?.[xi] ?? 0;
                    const opacity = getOpacity(v, min, max);
                    return (
                      <TooltipProvider key={`${yi}-${xi}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="h-10 md:h-12 border-t border-l flex items-center justify-center text-[11px] md:text-xs"
                              style={{
                                backgroundColor: `hsl(var(--primary) / ${opacity})`,
                              }}
                              aria-label={`${y} × ${xLabels[xi]}: ${v}`}
                            >
                              <span className="text-primary-foreground font-medium">
                                {v}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="text-xs font-medium">{y}</div>
                              <div className="text-xs text-muted-foreground">
                                {xLabels[xi]}
                              </div>
                              <Badge variant="outline" className="text-[11px]">
                                {v} complaints
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}

              {/* X axis label */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `160px repeat(${xLabels.length}, minmax(80px, 1fr))`,
                }}
              >
                <div />
                <div className="col-span-full p-2 text-xs text-center text-muted-foreground mt-2">
                  {xAxisLabel}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeatmapGrid;
