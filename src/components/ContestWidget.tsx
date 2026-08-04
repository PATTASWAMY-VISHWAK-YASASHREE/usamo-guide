import React from 'react'

const ContestWidget = () => (
  <div
    className="rounded-2xl p-6 shadow-lg animate-in zoom-in-95"
    style={{
      background: 'linear-gradient(180deg, rgba(54, 37, 72, 0.9) 0%, rgba(31, 22, 42, 0.94) 100%)',
    }}
  >
    <img
      src="/images/Contests.jpg"
      alt="Contest widget"
      className="w-full rounded-xl object-cover"
    />
  </div>
);

export default ContestWidget