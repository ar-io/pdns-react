import { useEffect, useState } from 'react';
import { startCase } from 'lodash';
import { LocalFileSystemDataProvider } from '../../../services/arweave/LocalFilesystemDataProvider';
import { AntCardProps } from '../../../types';
import './styles.css';

const ANT_DETAIL_MAPPINGS: { [x: string]: string } = {
  name: 'Nickname',
  id: 'ANT Contract ID',
  leaseDuration: 'Lease Duration',
  ttlSeconds: 'TTL Seconds',
};

function mapKeyToAttribute(key: string) {
  if (!!ANT_DETAIL_MAPPINGS[key]) {
    return ANT_DETAIL_MAPPINGS[key];
  }
  return startCase(key);
}

const PRIMARY_DETAILS: string[] = [
  'id',
  'domain',
  'owner',
  'controller',
  'ticker',
  'nickname',
].map((i) => mapKeyToAttribute(i));
const DEFAULT_ATTRIBUTES = {
  ttlSeconds: 60 * 60,
  leaseDuration: 'N/A',
  subdomains: 'Up to 100',
};

function AntCard(props: AntCardProps) {
  const { contract } = props;
  const { id, domain } = contract;
  const [antDetails, setAntDetails] = useState<{ [x: string]: string }>({});
  const [limitDetails, setLimitDetails] = useState(true);

  useEffect(() => {
    const dataProvider = new LocalFileSystemDataProvider();
    dataProvider.getContractState(id).then((antContractState) => {
      if (!antContractState) {
        return;
      }
      const allAntDetails: { [x: string]: any } = {
        ...antContractState,
        ...DEFAULT_ATTRIBUTES,
        id,
        domain,
      };
      // TODO: consolidate this logic that sorts and updates key values
      const replacedKeys = Object.keys(allAntDetails)
        .sort()
        .reduce((obj: any, key: string) => {
          // TODO: flatten recursive objects like subdomains, filter out for now
          if (typeof allAntDetails[key] === 'object') return obj;
          obj[mapKeyToAttribute(key)] = allAntDetails[key];
          return obj;
        }, {});
      setLimitDetails(true);
      setAntDetails(replacedKeys);
    });
  }, [id]);

  function showMore(e: any) {
    e.preventDefault();
    setLimitDetails(false);
  }

  // TODO: update this logic
  function handleClick(e: any) {
    console.log('Coming soon!');
  }

  return (
    <div className="card">
      {antDetails ? (
        // TODO: pull tier from ant contract details
        <span className="bubble">Tier 1</span>
      ) : (
        <></>
      )}
      {antDetails ? (
        Object.entries(antDetails).map(([key, value]) => {
          if (!PRIMARY_DETAILS.includes(key) && limitDetails) {
            return;
          }
          return (
            <span className="detail" key={key}>
              {key}:&nbsp;<b>{value}</b>
            </span>
          );
        })
      ) : (
        <></>
      )}
      {antDetails && limitDetails ? (
        <a onClick={showMore} className="link">
          more details...
        </a>
      ) : (
        <></>
      )}
      {antDetails ? (
        <button className="buttonLarge" onClick={handleClick}>
          Upgrade
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}

export default AntCard;
