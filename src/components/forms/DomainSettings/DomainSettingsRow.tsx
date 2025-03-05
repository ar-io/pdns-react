import { PencilIcon } from '@src/components/icons';
import { List } from 'antd';
import { CSSProperties } from 'react';

import './styles.css';

export default function DomainSettingsRow({
  label,
  value,
  action = [],
  editable,
  editing = false,
  customStyle = {},
  onCancel,
  onSave,
  setEditing,
}: {
  label?: string;
  value?: React.ReactNode;
  action?: React.ReactNode[] | React.ReactNode;
  editable?: boolean;
  editing?: boolean;
  customStyle?: CSSProperties;
  onCancel?: () => void;
  onSave?: () => void;
  setEditing?: () => void;
}) {
  return (
    <List.Item
      prefixCls="domain-settings-row"
      style={{
        borderColor: editing ? 'var(--text-grey)' : undefined,
        overflow: 'hidden',
        ...customStyle,
      }}
      actions={
        editable
          ? [
              ...(Array.isArray(action) ? action : [action]),
              <>
                {!editing && setEditing ? (
                  <button
                    className="button cursor-pointer hover"
                    onClick={setEditing}
                    style={{ boxSizing: 'border-box' }}
                  >
                    <PencilIcon
                      style={{
                        width: '16px',
                        height: '16px',
                        fill: 'var(--text-grey)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </button>
                ) : (
                  editable &&
                  onSave && (
                    <span
                      className="flex flex-row"
                      style={{
                        boxSizing: 'border-box',
                        gap: '10px',
                      }}
                    >
                      <button
                        className="button font-bold grey cursor-pointer hover"
                        style={{
                          padding: '3px 7px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                        onClick={onCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="button-primary hover"
                        style={{
                          padding: '3px 7px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                        onClick={onSave}
                      >
                        Save
                      </button>
                    </span>
                  )
                )}
              </>,
            ]
          : []
      }
    >
      {/* item controls css of meta via positional css selectors */}
      <List.Item.Meta prefixCls="domain-settings-meta" description={label} />
      <List.Item.Meta prefixCls="domain-settings-meta" description={value} />
    </List.Item>
  );
}
