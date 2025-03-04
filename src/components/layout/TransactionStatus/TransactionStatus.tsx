import { Tooltip } from 'antd';

import { RECOMMENDED_TRANSACTION_CONFIRMATIONS } from '../../../utils/constants';
import {
  AlertCircle,
  AlertTriangleIcon,
  CircleCheck,
  CircleXFilled,
} from '../../icons';

function TransactionStatus({
  confirmations,
  errorMessage,
  wrapperStyle,
}: {
  confirmations: number;
  errorMessage?: string;
  wrapperStyle?: any;
}): JSX.Element {
  function getStatusIcon(confirmations: number): JSX.Element {
    switch (true) {
      case errorMessage !== undefined:
        return (
          <CircleXFilled width={20} height={20} fill={'var(--error-red)'} />
        );
      case confirmations <= 0:
        return (
          <AlertCircle width={20} height={20} fill={'var(--text-faded)'} />
        );
      case confirmations > 0 &&
        confirmations < RECOMMENDED_TRANSACTION_CONFIRMATIONS:
        return (
          <AlertTriangleIcon width={20} height={20} fill={'var(--accent)'} />
        );
      case confirmations >= RECOMMENDED_TRANSACTION_CONFIRMATIONS:
        return (
          <CircleCheck width={20} height={20} fill={'var(--success-green)'} />
        );
      default:
        return <></>;
    }
  }
  function getTooltipText(
    confirmations: number,
    errorMessage?: string,
  ): string {
    switch (true) {
      case errorMessage !== undefined:
        return errorMessage && confirmations
          ? `Transaction has ${confirmations} | ${errorMessage}`
          : `Error getting status: ${errorMessage}`;
      case confirmations <= 0:
        return 'Transaction pending.';
      case confirmations > 0 &&
        confirmations < RECOMMENDED_TRANSACTION_CONFIRMATIONS:
        return `Transaction has ${confirmations} confirmations of ${RECOMMENDED_TRANSACTION_CONFIRMATIONS} recommended.`;
      case confirmations >= RECOMMENDED_TRANSACTION_CONFIRMATIONS:
        return `Transaction has ${confirmations} confirmations.`;
      default:
        return '';
    }
  }

  return (
    <span
      className="text white font-bold"
      style={{ alignItems: 'center', ...wrapperStyle }}
    >
      <Tooltip
        title={
          <span className=" flex center">
            {getTooltipText(confirmations, errorMessage)}
          </span>
        }
        placement={'top'}
        autoAdjustOverflow={true}
        color="var(--text-faded)"
        className="manage-asset-button-tooltip"
      >
        {getStatusIcon(confirmations)}
      </Tooltip>
    </span>
  );
}
export default TransactionStatus;
