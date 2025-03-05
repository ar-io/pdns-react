import { Tooltip } from '@src/components/data-display';
import UndernamesTable from '@src/components/data-display/tables/UndernamesTable';
import { SearchIcon } from '@src/components/icons';
import useDomainInfo from '@src/hooks/useDomainInfo';
import { MAX_UNDERNAME_COUNT } from '@src/utils/constants';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useWalletState } from '../../../state/contexts/WalletState';
import {
  formatForMaxCharCount,
  getOwnershipStatus,
  isArweaveTransactionID,
  lowerCaseDomain,
} from '../../../utils';
import eventEmitter from '../../../utils/events';
import './styles.css';

function Undernames() {
  const navigate = useNavigate();
  const { id, name } = useParams();
  const {
    data,
    isLoading: isLoadingDomainInfo,
    refetch,
  } = useDomainInfo({
    domain: name,
    antId: isArweaveTransactionID(id) ? id : undefined,
  });
  const [{ walletAddress }] = useWalletState();
  const [isMaxUndernameCount, setIsMaxUndernameCount] =
    useState<boolean>(false);
  const [ownershipStatus, setOwnershipStatus] = useState<
    'controller' | 'owner' | undefined
  >(undefined);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    if (!id && !name) {
      eventEmitter.emit('error', new Error('Missing ANT transaction ID.'));
      navigate('/manage/ants');
      return;
    }
    if (data?.owner && data?.controllers) {
      setOwnershipStatus(
        getOwnershipStatus(
          data?.owner,
          data?.controllers,
          walletAddress?.toString(),
        ),
      );
    }

    setIsMaxUndernameCount(
      !!data?.arnsRecord?.undernameLimit &&
        data?.arnsRecord?.undernameLimit >= MAX_UNDERNAME_COUNT,
    );
  }, [
    id,
    name,
    data?.owner,
    data?.controllers,
    walletAddress,
    isLoadingDomainInfo,
  ]);

  return (
    <>
      <div className="px-[100px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-justify-between">
            <div
              className="flex flex-row"
              style={{ justifyContent: 'space-between' }}
            >
              <h2 className="white text-[2rem] whitespace-nowrap">
                Manage Undernames
              </h2>
              <Tooltip
                message={
                  isMaxUndernameCount
                    ? 'Max undername support reached'
                    : 'Increase undername support'
                }
                icon={
                  <button
                    disabled={isLoadingDomainInfo || isMaxUndernameCount}
                    className={`button-secondary ${
                      isLoadingDomainInfo || isMaxUndernameCount
                        ? 'disabled-button'
                        : 'hover'
                    }`}
                    style={{
                      padding: '9px',
                      gap: '8px',
                      fontSize: '14px',
                      color: 'var(--accent)',
                    }}
                    onClick={() =>
                      navigate(
                        `/manage/names/${lowerCaseDomain(
                          name!,
                        )}/upgrade-undernames`,
                      )
                    }
                  >
                    Increase Undernames
                  </button>
                }
              />
            </div>
          </div>

          <div>
            <div className="flex w-full p-3 border-x-[1px] border-t-[1px] border-dark-grey rounded-t-[5px] relative">
              <SearchIcon
                width={'18px'}
                height={'18px'}
                className="fill-white absolute top-[13.5px] left-[11px]"
              />
              <input
                className="pl-7 flex bg-background w-full focus:outline-none text-white placeholder:text-dark-grey"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                placeholder={`Search undernames on '${
                  name ?? formatForMaxCharCount(id ?? '', 10)
                }'`}
              />
            </div>
            <UndernamesTable
              undernames={data?.records ?? {}}
              arnsDomain={name}
              info={data?.info}
              antId={data?.arnsRecord?.processId}
              ownershipStatus={ownershipStatus}
              isLoading={isLoadingDomainInfo}
              filter={search}
              refresh={() => {
                if (isLoadingDomainInfo) return;
                refetch();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Undernames;
