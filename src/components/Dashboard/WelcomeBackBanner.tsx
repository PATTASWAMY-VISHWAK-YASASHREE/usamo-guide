import { Link } from 'gatsby';
import * as React from 'react';

export default function WelcomeBackBanner({
  lastViewedModuleURL,
  lastViewedModuleLabel,
}) {
  return (
    <div
      className="w-full shadow-lg lg:rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(54, 37, 72, 0.9) 0%, rgba(31, 22, 42, 0.94) 100%)',
      }}
    >
      <Link
        className="block px-4 py-6 sm:flex sm:items-center sm:justify-between sm:p-8"
        to={
          lastViewedModuleURL ||
          '/foundations'
        }
      >
        <div>
          <h3 className="text-xl leading-7 font-medium sm:text-2xl" style={{ color: '#F4EDEA' }}>
            {lastViewedModuleURL
              ? 'Welcome Back!'
              : 'Welcome to the USAMO Guide!'}
          </h3>
          <div className="mt-2 font-medium" style={{ color: '#F0C2FF' }}>
            <p>
              {lastViewedModuleURL
                ? `Pick up where you left off. Your last viewed module was "${lastViewedModuleLabel}."`
                : 'Start your Journey!'}
            </p>
          </div>
        </div>
        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center lg:mr-2">
          <span className="inline-flex rounded-md shadow-sm">
            <span
              className="purple-motion-effect inline-flex items-center justify-center rounded-full px-6 py-2 font-mono text-sm font-bold leading-tight sm:text-base lg:px-8 lg:py-3"
              style={{
                border: '1px solid rgba(240, 194, 255, 0.34)',
                background: 'linear-gradient(135deg, #5A2F87 0%, #C58BFF 100%)',
                '--pme-color': '#F4EDEA',
                '--pme-hover-color': '#201C36',
                '--pme-wipe-bg': '#F0C2FF',
              } as React.CSSProperties}
            >
              {lastViewedModuleURL
                ? `Continue: ${lastViewedModuleLabel}`
                : 'Explore Your First topic'}
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
