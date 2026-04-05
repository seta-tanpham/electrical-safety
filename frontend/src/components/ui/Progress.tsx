import React from "react";

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress-root ${className}`.trim()}>
      <div className="progress-bar" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
