import { ArgsProps } from 'antd/es/notification/interface';
import { ReactNode } from 'react';

import { CircleXIcon, CloseIcon } from '../../icons';

export const defaultError = ({
  actionCallback,
  actionText,
  closeCallback,
  title,
  description,
  key,
  icon,
}: {
  actionCallback: () => void;
  actionText: string;
  closeCallback: () => void;
  title: string;
  description: ReactNode;
  key: string;
  icon?: JSX.Element;
}): ArgsProps => ({
  key: key,
  message: (
    <h4
      className="flex flex-row white"
      style={{ marginTop: '0px', justifyContent: 'space-between' }}
    >
      {title}
      <button
        className="button center cursor-pointer"
        onClick={() => closeCallback()}
        style={{ padding: '0px' }}
      >
        <CloseIcon width={'25px'} height={'25px'} fill={'var(--text-white)'} />
      </button>
    </h4>
  ),
  description: <div className="grey">{description}</div>,
  btn: (
    <button
      className="button-primary"
      style={{ padding: '9px 12px' }}
      onClick={() => actionCallback()}
    >
      {actionText}
    </button>
  ),
  closeIcon: false,
  icon: icon ?? (
    <CircleXIcon width={'25px'} height={'25px'} fill={'var(--error-red)'} />
  ),
  placement: 'bottomRight',
  duration: 30,
  style: {
    fontFamily: 'Rubik',
    background: 'var(--card-bg)',
    color: 'var(--text-white)',
    boxShadow: 'var(--shadow)',
  },
});
