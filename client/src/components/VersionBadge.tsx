import React from 'react';
import { BUILD_META } from '../buildMeta';

const VersionBadge: React.FC = () => {
  const commit = BUILD_META.commit || 'dev';
  const time = BUILD_META.time || '';
  return (
    <div
      title={`Commit: ${commit}\nBuilt: ${time}`}
      className="fixed bottom-3 right-3 z-[9999] select-none rounded-md border border-gray-200 bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      v:{commit.slice(0, 7)} · {new Date(time || Date.now()).toLocaleString()}
    </div>
  );
};

export default VersionBadge;