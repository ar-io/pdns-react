import { Tooltip } from 'antd';
import { useState } from 'react';

import { CopyIcon } from '../../../icons';
import './styles.css';

function CopyTextButton({
  body,
  copyText,
  size,
  wrapperStyle = {},
  position = 'absolute',
  copyButtonStyle,
}: {
  body: JSX.Element | string;
  copyText: string;
  size: number | string;
  wrapperStyle?: any;
  position?: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
  copyButtonStyle?: any;
}) {
  const [textCopied, setTextCopied] = useState<boolean>(false);

  async function handleCopy() {
    if (!document.hasFocus()) {
      /** this is an intermittent non-emitting notifying error that is hard to reproduce, but this SHOULD fix it
       * NotAllowedError: Document not focused
       */
      return;
    }
    setTextCopied(true);
    if (copyText) {
      await navigator.clipboard.writeText(copyText);
    }
    setTimeout(() => {
      setTextCopied(false);
    }, 500);
  }

  return (
    <div className="flex-row" style={{ position, ...wrapperStyle }}>
      <button
        className="button flex justify-center cursor-pointer"
        style={{
          ...wrapperStyle,
          gap: '8px',
          padding: '0px',
        }}
        onClick={() => handleCopy()}
      >
        <span className="flex white center" style={{ fontSize: 'inherit' }}>
          {body}&nbsp;
        </span>
        <Tooltip
          open={textCopied}
          title={'Copied!'}
          placement="right"
          autoAdjustOverflow={true}
          arrow={false}
          overlayClassName="copy-tooltip"
          overlayInnerStyle={{
            color: 'var(--text-black)',
            boxShadow: 'var(--shadow)',
            fontFamily: 'Rubik-Bold',
            backgroundColor: 'var(--text-white)',
            fontSize: '10px',
            display: 'flex',
            justifyContent: 'center',
            borderRadius: 'var(--corner-radius)',
            padding: '4px 8px',
          }}
        >
          <div
            className="flex items-center justify-center cursor-pointer"
            style={{
              scale: size,
              overflow: 'visible',
              ...copyButtonStyle,
            }}
          >
            <CopyIcon
              height={size ?? '15px'}
              width={size ?? '15px'}
              fill={'inherit'}
            />
          </div>
        </Tooltip>
      </button>
    </div>
  );
}

export default CopyTextButton;
