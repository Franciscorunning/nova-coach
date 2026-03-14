import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({ title, subtitle, actions, noPadding = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-gray-100 ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {(title || actions) && (
        <div className={`flex items-start justify-between gap-4 ${noPadding ? 'px-6 pt-6' : 'mb-4'}`}>
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
