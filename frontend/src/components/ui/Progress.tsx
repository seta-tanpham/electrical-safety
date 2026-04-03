import React from "react";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = "" }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={className}
      style={{ background: "#e2e8f0", borderRadius: 999, height: 6, overflow: "hidden" }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: "#0f172a",
          borderRadius: 999,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}
