import { AoANTHandler, AoANTState, AoArNSNameData } from '@ar.io/sdk';
import { Tooltip } from '@src/components/data-display';
import { ANTProcessData, useArNSState, useWalletState } from '@src/state';
import { getAntsRequiringUpdate } from '@src/utils';
import { MILLISECONDS_IN_GRACE_PERIOD } from '@src/utils/constants';
import { BellIcon, Circle, CircleAlert, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react-markdown';
import { Link } from 'react-router-dom';

export type Notification = {
  type: 'success' | 'warning' | 'error';
  message: ReactNode;
  link: string;
};

export function isInGracePeriod(record: AoArNSNameData) {
  const endTimestamp = (record as any)?.endTimestamp;
  if (!endTimestamp) return false;
  const expirationDate = endTimestamp + MILLISECONDS_IN_GRACE_PERIOD;
  return endTimestamp < Date.now() && Date.now() < expirationDate;
}

export function createExpirationNotification(
  domains: Record<string, AoArNSNameData>,
): Notification | undefined {
  const domainsExpiring = Object.values(domains).reduce(
    (acc: number, record: AoArNSNameData) => {
      if (isInGracePeriod(record)) {
        acc++;
      }
      return acc;
    },
    0,
  );

  if (!domainsExpiring) return;

  return {
    type: 'warning',
    message: (
      <span className="w-full">
        <span className="font-bold">{domainsExpiring}</span> names are about to
        expire.
      </span>
    ),
    link:
      '/manage/names?' +
      new URLSearchParams({ sortBy: 'expiryDate' }).toString(),
  };
}

export function createUpdateAntsNotification({
  ants,
  userAddress,
}: {
  ants: Record<string, ANTProcessData>;
  userAddress: string;
}): Notification | undefined {
  const antsRequiringUpdate = getAntsRequiringUpdate({
    ants,
    userAddress,
  }).length;

  if (!antsRequiringUpdate) return;

  return {
    type: 'warning',
    message: (
      <span className="w-full">
        <span className="font-bold">{antsRequiringUpdate}</span>{' '}
        {antsRequiringUpdate > 1 ? 'ANTs need updating' : ' ANT needs updating'}
      </span>
    ),
    link:
      '/manage/names?' +
      new URLSearchParams({ sortBy: 'ioCompatible' }).toString(),
  };
}

export function createNamesExceedingUndernameLimitNotification({
  domains,
  ants,
}: {
  domains: Record<string, AoArNSNameData>;
  ants: Record<
    string,
    { state: AoANTState | null; handlers: AoANTHandler[] | null }
  >;
}): Notification | undefined {
  const domainsRequiringUndernameSupportUpgrade = Object.values(domains).reduce(
    (acc: number, record: AoArNSNameData) => {
      const undernameCount = Object.keys(
        ants?.[record.processId]?.state?.Records ?? {},
      ).filter((key) => key !== '@')?.length;
      if (undernameCount > record.undernameLimit) ++acc;
      return acc;
    },
    0,
  );

  if (!domainsRequiringUndernameSupportUpgrade) return;

  return {
    type: 'warning',
    message: (
      <span className="w-full">
        <span className="font-bold">
          {domainsRequiringUndernameSupportUpgrade}
        </span>{' '}
        names have exceeded their under_name capacity.
      </span>
    ),
    link:
      '/manage/names?' +
      new URLSearchParams({ sortBy: 'undernames' }).toString(),
  };
}

function NotificationMenu() {
  const [{ walletAddress }] = useWalletState();
  const [{ domains, ants }] = useArNSState();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (domains && ants && walletAddress) {
      setNotifications(
        [
          createExpirationNotification(domains),
          createNamesExceedingUndernameLimitNotification({ domains, ants }),
          createUpdateAntsNotification({
            ants,
            userAddress: walletAddress.toString(),
          }),
        ].filter(
          (notification) => notification !== undefined,
        ) as Notification[],
      );
    }
  }, [domains, ants, walletAddress]);

  return (
    <Tooltip
      tooltipOverrides={{
        className: 'w-fit',
        color: 'var(--card-bg)',
        overlayStyle: {
          width: 'fit-content',
          minWidth: '300px',
        },
      }}
      message={
        <div className="flex flex-col w-full gap-3 text-white items-center justify-center">
          {notifications.length ? (
            notifications.map((notification, index) => (
              <div className="flex flex-row size-fit" key={index}>
                <span
                  className="flex flex-row justify-center items-start"
                  style={{ gap: '20px' }}
                >
                  <span>
                    {notification.type == 'success' ? (
                      <Circle
                        className="text-success fill-success"
                        width={'16px'}
                        height={'16px'}
                      />
                    ) : notification.type == 'warning' ? (
                      <CircleAlert
                        className="text-primary"
                        width={'16px'}
                        height={'16px'}
                      />
                    ) : (
                      <CircleAlert
                        className="text-error"
                        width={'16px'}
                        height={'16px'}
                      />
                    )}
                  </span>
                  {notification.message}
                </span>
                <Link
                  to={notification.link}
                  className="p-2 rounded bg-dark-grey text-bg-dark-grey"
                >
                  <Settings className="size-4" />
                </Link>
              </div>
            ))
          ) : (
            <span className="text-sm text-grey p-2">No Notifications</span>
          )}
        </div>
      }
      icon={
        <BellIcon
          className={`${
            notifications.length
              ? 'text-primary fill-primary animate-pulse'
              : 'text-white fill-white'
          } size-4 m-2 cursor-pointer`}
        />
      }
    />
  );
}

export default NotificationMenu;
