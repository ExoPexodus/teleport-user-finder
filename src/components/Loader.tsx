
import React from 'react';

export const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="w-12 h-12 border-4 border-t-teleport-blue border-r-transparent border-b-teleport-blue border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-teleport-lightblue font-medium">Loading users from Teleport...</p>
    </div>
  );
};
