import { Tooltip as AntdTooltip, TooltipProps } from 'antd';
import { XCircleIcon } from 'lucide-react';
import { ReactNode } from 'react';

function ErrorsTip({
  errors,
  icon = <XCircleIcon width={'18px'} height={'18px'} className="text-error" />,
  tooltipOverrides,
}: {
  errors: Error[];
  icon?: ReactNode;
  tooltipOverrides?: Partial<TooltipProps>;
}) {
  const uniqueErrors = new Set(errors);
  return (
    <>
      <AntdTooltip
        title={
          <div className="flex fit-content flex-col gap-2">
            {[...uniqueErrors].map((e, i) => (
              <div
                key={i}
                className="flex flex-col border-b border-grey whitespace-nowrap py-1"
              >
                <span className="text-[1rem]">{e.name}:</span>
                <span className="text-error">{e.message}</span>
              </div>
            ))}
          </div>
        }
        color="var(--box-color)"
        className="cursor-pointer"
        overlayInnerStyle={{ padding: '15px', width: 'fit-content' }}
        {...tooltipOverrides}
        destroyTooltipOnHide={true}
      >
        {icon}
      </AntdTooltip>
    </>
  );
}

export default ErrorsTip;
