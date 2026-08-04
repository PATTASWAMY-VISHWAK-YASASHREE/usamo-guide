import * as React from 'react';
import { TOCHeading } from '../../../models/module';
import genLinksFromTOCHeadings from './genLinksFromTOCHeadings';

const TableOfContentsBlock = ({
  tableOfContents,
}: {
  tableOfContents: TOCHeading[];
}) => {
  const links = genLinksFromTOCHeadings(
    tableOfContents,
    _ =>
      'block mb-1 text-sm transition hover:underline text-[rgba(244,237,234,0.72)] hover:text-[#F0C2FF]'
  );

  if (tableOfContents.length <= 1) {
    return null;
  }

  return (
    <aside
      className="mb-6 rounded-2xl p-5 shadow-lg lg:float-right lg:ml-6 lg:mb-4 lg:w-72"
      style={{
        background: 'linear-gradient(180deg, rgba(54,37,72,0.9) 0%, rgba(31,22,42,0.94) 100%)',
 :'1px solid rgba(229,194,255,0.12)',
      }}
    >
      <h2 className="mb-4 text-sm font-bold tracking-wider uppercase" style={{ color: 'rgba(244,237,234,0.6)' }}>
        Table of Contents
      </h2>
      {links}
    </aside>
  );
};

export default TableOfContentsBlock;
