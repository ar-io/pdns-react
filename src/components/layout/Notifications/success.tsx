import { ArgsProps } from 'antd/es/notification/interface';
import { ReactNode } from 'react';

import { CircleCheckFilled, CloseIcon } from '../../icons';

export const defaultSuccess = ({
  actionCallback,
  actionText,
  closeCallback,
  title,
  description,
  key,
  icon,
}: {
  actionCallback?: () => void;
  actionText?: string;
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
  btn: actionCallback ? (
    <button
      className="button-primary"
      style={{ padding: '9px 12px' }}
      onClick={() => actionCallback()}
    >
      {actionText}
    </button>
  ) : undefined,
  closeIcon: false,
  icon: icon ?? (
    <CircleCheckFilled
      className="mt-[2px]"
      width={'20px'}
      height={'20px'}
      fill={'var(--success-green)'}
    />
  ),
  placement: 'bottomRight',
  duration: 30,
  style: {
    background: 'var(--card-bg)',
    color: 'var(--text-white)',
    boxShadow: 'var(--shadow)',
    borderRadius: 'var(--border-radius)',
  },
});
