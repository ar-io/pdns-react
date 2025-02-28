import { buildDomainInfoQuery } from '@src/hooks/useDomainInfo';
import { useGlobalState } from '@src/state';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { Link } from 'react-router-dom';

import {
  decodeDomainToASCII,
  formatForMaxCharCount,
  isARNSDomainNameValid,
  isArweaveTransactionID,
} from '../../../utils';
import { RESERVED_BREADCRUMB_TITLES } from '../../../utils/constants';
import eventEmitter from '../../../utils/events';
import { ChevronDownIcon } from '../../icons';

export type NavItem = {
  name: string;
  route: string;
};

export const ANT_FLAG = 'ant-flag';

function Breadcrumbs() {
  const [{ aoNetwork, gateway }] = useGlobalState();
  const queryClient = useQueryClient();
  const location = useLocation();
  const path = location.pathname.split('/');
  const matches = useMatches();
  const [crumbs, setCrumbs] = useState<NavItem[]>([]);

  useEffect(() => {
    if (!matches) {
      return;
    }
    handleCrumbs();
  }, [matches, location]);

  async function handleCrumbs() {
    try {
      let processId = '';
      let name = '';

      const rawCrumbs = matches
        .filter(
          (match: any) =>
            match?.handle?.crumbs && match.pathname === location.pathname,
        )
        .map((match: any) => {
          if (match.params?.id) {
            processId = match.params?.id;
          }
          if (match.params?.name) {
            name = match.params?.name;
          }
          return match?.handle?.crumbs(Object.values(match.params)[0]);
        });
      // check for ant flag
      if (isArweaveTransactionID(processId)) {
        const domainInfo = await queryClient.fetchQuery(
          buildDomainInfoQuery({
            antId: processId,
            aoNetwork,
            gateway,
          }),
        );
        const name = domainInfo?.name;

        const parsedCrumbs = rawCrumbs[0].map((crumb: NavItem) => {
          if (crumb.name == ANT_FLAG) {
            return { name: name, route: crumb.route };
          }
          return crumb;
        });
        setCrumbs(parsedCrumbs);
      } else if (name.length && isARNSDomainNameValid({ name })) {
        const parsedCrumbs = rawCrumbs[0].map((crumb: NavItem) => {
          if (crumb.name == ANT_FLAG) {
            return { name: name, route: crumb.route };
          }
          return crumb;
        });
        setCrumbs(parsedCrumbs);
      } else {
        setCrumbs(rawCrumbs[0]);
      }
    } catch (error) {
      eventEmitter.emit('error', error);
    }
  }

  // TODO: move this to a css class
  function handleCrumbTitle(title: string) {
    if (RESERVED_BREADCRUMB_TITLES.has(title)) {
      return title;
    }
    return formatForMaxCharCount(title, 16);
  }

  return (
    <>
      {crumbs?.length ? (
        <nav
          style={{ gap: '0px' }}
          className="flex h-[35px] flex-row items-center justify-start bg-black p-2 pl-[100px]"
        >
          {crumbs.map((item, index) => {
            const crumbTitle = handleCrumbTitle(item.name);

            const crumbLink = (
              <Link
                className="link faded hover"
                style={{
                  fontSize: '16px',
                  color:
                    path.at(-1) === item?.route?.split('/').at(-1)
                      ? 'white'
                      : 'var(--text-grey)',
                }}
                to={item?.route ?? '/'}
              >
                {decodeDomainToASCII(crumbTitle)}
              </Link>
            );

            return (
              <span key={index} className="center faded flex">
                {crumbTitle === item.name ? (
                  crumbLink
                ) : (
                  <Tooltip
                    title={
                      <span className="center text-md flex w-fit">
                        {item.name}
                      </span>
                    }
                    placement={'top'}
                    autoAdjustOverflow={true}
                    overlayClassName="w-fit max-w-fit h-fit"
                    color="var(--bg-color)"
                  >
                    {crumbLink}
                  </Tooltip>
                )}
                {index < crumbs.length - 1 && (
                  <span
                    className="flex items-center justify-center"
                    style={{ padding: '0 8px' }} // Add some padding between breadcrumbs
                  >
                    <ChevronDownIcon
                      width={'10px'}
                      height={'10px'}
                      fill={'var(--text-grey)'}
                      style={{ transform: 'rotate(-90deg)' }}
                    />
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}

export default Breadcrumbs;
