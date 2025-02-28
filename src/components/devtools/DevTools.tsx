import React, { Suspense, useEffect, useState } from 'react';

import DialogModal from '../modals/DialogModal/DialogModal';
import ArNSRegistrySettings from './ArNSRegistrySettings';
import NetworkSettings from './NetworkSettings';
import TransferIO from './TransferIO';
import UserAddress from './UserAddress';
import './styles.css';

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
) as any;

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTanstackTools, setShowTanstackTools] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: any) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
      toggleModal();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div className="modal-container">
          <DialogModal
            title={<h2 className="text-white text-2xl">ArNS Devtools</h2>}
            body={
              <div
                className="flex flex-column white scrollbar scrollbar-w-2 scrollbar-thumb-dark-grey scrollbar-thumb-rounded-md p-2"
                style={{
                  gap: '20px',
                  fontSize: '13px',

                  lineHeight: '1.5',
                  fontWeight: 160,
                  width: '90vw',
                  height: '70vh',
                  overflowY: 'auto',
                }}
              >
                <div className="flex flex-column" style={{ gap: '10px' }}>
                  <UserAddress />
                  <TransferIO />
                  <ArNSRegistrySettings />
                  <NetworkSettings />
                  <button
                    onClick={() => setShowTanstackTools(true)}
                    className="border border-white rounded text-white p-2"
                  >
                    Enable Tanstack Query Tools
                  </button>
                </div>
              </div>
            }
            onCancel={toggleModal}
            onClose={toggleModal}
            cancelText={'Close Devtools'}
          />
        </div>
      )}
      {showTanstackTools && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction
            onClose={() => {
              setShowTanstackTools(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default DevTools;
