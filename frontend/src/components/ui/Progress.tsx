import React from "react";

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress-track ${className}`.trim()}>
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
