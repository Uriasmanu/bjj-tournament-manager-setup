import { Card, Text, Center, Group } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import type { ReactNode, CSSProperties } from 'react';

interface MenuCardProps {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number; color?: string }>;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: ReactNode;
  style?: CSSProperties;
}

export function MenuCard({
  label,
  description,
  icon: Icon,
  onClick,
  ariaLabel,
  disabled,
  children,
  iconBg = 'var(--mantine-color-blue-0)',
  iconColor = 'var(--mantine-color-blue-6)',
  badge,
  style,
}: MenuCardProps) {
  return (
    <Card
      withBorder
      shadow="sm"
      padding="lg"
      radius="md"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || label}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = '';
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
    >
      <Group wrap="nowrap" align="flex-start">
        <Center
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: iconBg,
            flexShrink: 0,
            transition: 'background-color 0.2s, color 0.2s',
          }}
          className="menu-card-icon"
        >
          <Icon size={24} color={iconColor} />
        </Center>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" align="center">
            <Text fw={700} size="sm" truncate="end" style={{ flex: 1 }}>
              {label}
            </Text>
            {badge}
          </Group>
          <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
            {description}
          </Text>
          <Group gap={4} mt={8}>
            <Text size="xs" fw={700} c="blue" style={{ transition: 'transform 0.2s' }} className="menu-card-action">
              Acessar
            </Text>
            <IconChevronRight size={12} color="var(--mantine-color-blue-6)" style={{ transition: 'transform 0.2s' }} className="menu-card-action" />
          </Group>
          {children}
        </div>
      </Group>
    </Card>
  );
}
