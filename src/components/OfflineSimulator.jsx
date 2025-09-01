import React, { useState } from 'react';
import Button from './Button';

/**
 * A development/testing component to manually simulate network outages.
 */
function OfflineSimulator() {
  const [isForcedOffline, setIsForcedOffline] = useState(false);

  const handleToggle = () => {
    if (isForcedOffline) {
      // If we are currently simulating offline, the next click should bring us back online.
      console.log('%c[SIMULATOR] Manually going online...', 'color: green;');
      window.dispatchEvent(new Event('online'));
      setIsForcedOffline(false);
    } else {
      // If we are currently online, the next click should take us offline.
      console.log('%c[SIMULATOR] Manually going offline...', 'color: orange;');
      window.dispatchEvent(new Event('offline'));
      setIsForcedOffline(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleToggle}
        className={
          isForcedOffline
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg'
            : 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-500 shadow-lg'
        }
      >
        {isForcedOffline ? 'Go Back Online' : 'Simulate Going Offline'}
      </Button>
    </div>
  );
}

export default OfflineSimulator;

