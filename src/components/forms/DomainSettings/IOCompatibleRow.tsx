import { Tooltip } from '@src/components/data-display';
import UpgradeDomainModal from '@src/components/modals/ant-management/UpgradeDomainModal/UpgradeDomainModal';
import { CircleCheck, CircleX } from 'lucide-react';
import { useState } from 'react';

import DomainSettingsRow from './DomainSettingsRow';

export default function IOCompatibleRow({
  editable,
  domain,
  requiresUpdate,
}: {
  domain?: string;
  requiresUpdate: boolean;
  editable: boolean;
}) {
  const [showUpgradeDomainModal, setShowUpgradeDomainModal] = useState(false);
  return (
    <>
      <DomainSettingsRow
        label="AR.IO Compatible:"
        editable={true}
        value={
          !requiresUpdate ? (
            <CircleCheck className="text-success w-[16px]" />
          ) : (
            <CircleX className="text-error w-[16px]" />
          )
        }
        action={
          // editable controls if user has permission to upgrade
          editable &&
          // if source code id is defined and a txid check if its a valid version
          requiresUpdate && [
            <Tooltip
              key={1}
              message={'Your ANT requires an update'}
              icon={
                <button
                  onClick={() => setShowUpgradeDomainModal(true)}
                  className="p-[6px] px-[10px] text-[12px] rounded-[4px] bg-primary-thin hover:bg-primary border hover:border-primary border-primary-thin text-primary hover:text-black transition-all whitespace-nowrap"
                >
                  Upgrade ANT
                </button>
              }
            />,
          ]
        }
      />
      {domain && (
        <UpgradeDomainModal
          domain={domain}
          visible={showUpgradeDomainModal}
          setVisible={(b: boolean) => setShowUpgradeDomainModal(b)}
        />
      )}
    </>
  );
}
