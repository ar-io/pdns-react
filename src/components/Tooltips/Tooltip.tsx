import { Tooltip as AntdTooltip, TooltipProps } from 'antd';
import { ReactNode } from 'react';

import { InfoIcon } from '../icons';

function Tooltip({
  message,
  icon = (
    <InfoIcon
      style={{ fontSize: '20px', fill: 'var(--text-grey)', width: '20px' }}
    />
  ),
  tooltipOverrides,
}: {
  message: JSX.Element | string;
  icon?: ReactNode;
  tooltipOverrides?: Partial<TooltipProps>;
}) {
  return (
    <>
      <AntdTooltip
        title={message}
        color="var(--box-color)"
        className="cursor-pointer"
        overlayInnerStyle={{ padding: '15px' }}
        {...tooltipOverrides}
        destroyTooltipOnHide={true}
      >
        {icon}
      </AntdTooltip>
    </>
  );
}

export default Tooltip;
