import React from "react";

interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
