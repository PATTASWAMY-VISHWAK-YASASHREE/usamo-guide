import * as React from 'react';

export default function DashboardCard(props) {
  return (
    <div
      className="rounded-2xl p-0 shadow-lg transition hover:shadow-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(54, 37, 72, 0.9) 0%, rgba(31, 22, 42, 0.94) 100%)',
      }}
      {...props}
    />
  );
}
