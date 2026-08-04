import * as React from 'react';

const ForumCTA = (): JSX.Element => {
  return (
    <div
      className="mx-auto mb-6 max-w-3xl rounded-2xl shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(54,37,72,0.9) 0%, rgba(31,22,42,0.94) 100%)',
      }}
    >
      <div className="px-4 py-5 text-center sm:p-6">
        <h3 className="text-lg leading-6 font-semibold font-mono" style={{ color: '#F4EDEA' }}>
          Join the Discord Community!
        </h3>
        <div className="mx-auto mt-2 max-w-xl text-sm leading-5" style={{ color: 'rgba(244,237,234,0.72)' }}>
          <p>
            Stuck on a problem, or don't understand a module? Join the Discord
            and get help with your doubts while making more math friends.
          </p>
        </div>
        <div className="mt-5 flex justify-center">
          <a
            href="https://discord.gg/X2zx6u53XH"
            target="_blank"
            rel="noreferrer"
            className="purple-motion-effect inline-flex items-center justify-center rounded-full px-6 py-2.5 font-mono text-sm font-bold leading-tight"
            style={{
              border: '1px solid rgba(240, 194, 255, 0.34)',
              background: 'linear-gradient(135deg, #5A2F87 0%, #C58BFF 100%)',
              boxShadow: 'none',
              '--pme-color': '#F4EDEA',
              '--pme-hover-color': '#201C36',
              '--pme-wipe-bg': '#F0C2FF',
            } as React.CSSProperties}
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForumCTA;
