import * as React from 'react';

export default function DashboardCard(props) {
  return (
    <div
      className="rounded-2xl p-0 transition"
      style={{
        background: 'var(--card-bg)',
      }}
      {...props}
    />
  );
}
