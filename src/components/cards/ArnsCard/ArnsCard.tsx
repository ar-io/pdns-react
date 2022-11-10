import axios from 'axios';
import { useEffect, useState } from 'react';

import { useStateValue } from '../../../state/state';
import { ArnsCardProps } from '../../../types';
import './styles.css';

function ArnsCard({ name }: ArnsCardProps) {
  const [{ arnsSourceContract }] = useStateValue();
  const [antDetails, setAntDetails] = useState({
    name: 'arns',
    gateway: 'arweave.net',
    antContractAddress: '',
    image: '',
    expiry: '',
  });

  useEffect(() => {
    getAntDetailsFromName(name);
  }, []);

  async function getAntDetailsFromName(name: string) {
    const antAddress = arnsSourceContract.records[name];
    const expiry = new Date().toDateString();
    const imageUrl = await axios
      .get(`http://${name}.arweave.dev`)
      .then((res) => res.data)
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const metaImage = doc
          ?.querySelector("meta[property='og:image']")
          ?.getAttribute('content');

        return metaImage;
      });

    setAntDetails({
      name: name,
      gateway: 'arweave.dev',
      antContractAddress: antAddress,
      image: `${imageUrl}`,
      expiry: expiry,
    });
  }

  return (
    <div className="arnsCard">
      <img className="arnsPreview" src={antDetails.image} alt="" />
      <div className="arnsCardFooter">
        <span className="arnsLink">{`${antDetails.name}.${antDetails.gateway}`}</span>
        <span className="expiryText">Exp. {antDetails.expiry}</span>
      </div>
    </div>
  );
}

export default ArnsCard;
