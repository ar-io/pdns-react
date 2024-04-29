import { ArweaveTransactionID } from '@src/services/arweave/ArweaveTransactionID';
import { useEffect, useState } from 'react';

import { useGlobalState } from '../../state/contexts/GlobalState';

const defaultReserved = {
  isReserved: false,
  reservedFor: undefined,
};

export function useRegistrationStatus(domain: string) {
  const [{ blockHeight, arweaveDataProvider }, dispatchGlobalState] =
    useGlobalState();
  const [isActiveAuction, setIsActiveAuction] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isReserved, setIsReserved] = useState<{
    isReserved: boolean;
    reservedFor?: ArweaveTransactionID;
  }>(defaultReserved);
  const [validated, setValidated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!domain.length) {
      reset();
    }
    updateRegistrationStatus(domain);
  }, [domain]);

  function reset() {
    setIsAvailable(false);
    setIsReserved(defaultReserved);
    setIsActiveAuction(false);
    setValidated(false);
  }

  async function updateRegistrationStatus(domain: string) {
    try {
      reset();
      setLoading(true);
      setValidated(false);

      if (!domain.length) {
        return reset();
      }

      if (!blockHeight) {
        const block = await arweaveDataProvider.getCurrentBlockHeight();
        if (!block) {
          throw new Error('Could not get current block height');
        }
        dispatchGlobalState({
          type: 'setBlockHeight',
          payload: block,
        });
        return;
      }
      const availablePromise = arweaveDataProvider.isDomainAvailable({
        domain,
      });
      const auctionPromise = arweaveDataProvider.isDomainInAuction({
        domain,
      });
      const reservedPromise = arweaveDataProvider.isDomainReserved({
        domain,
      });

      const [isAvailable, isActiveAuction, isReserved] = await Promise.all([
        availablePromise,
        auctionPromise,
        reservedPromise,
      ]);

      setIsAvailable(isAvailable);
      setIsActiveAuction(isActiveAuction);
      setIsReserved({
        ...isReserved,
        reservedFor: isReserved.reservedFor
          ? new ArweaveTransactionID(isReserved.reservedFor)
          : undefined,
      });
      setValidated(true);
    } catch (error) {
      console.error(error);
      reset();
    } finally {
      setLoading(false);
    }
  }
  return {
    isAvailable,
    isActiveAuction,
    isReserved: isReserved?.isReserved,
    reservedFor: isReserved?.reservedFor,
    loading,
    validated,
  };
}
