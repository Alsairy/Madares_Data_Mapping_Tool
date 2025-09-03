import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  const baseStyles = onClick ? 'hover:bg-gray-50 cursor-pointer' : '';
  
  return (
    <tr className={`${baseStyles} ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | 'none';
  scope?: 'col' | 'row';
}

export const TableHead: React.FC<TableHeadProps> = ({
  children, 
  className = '', 
  sortable = false,
  onSort,
  sortDirection = 'none',
  scope = 'col'
}) => {
  const baseStyles = `
    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
  `;
  
  const sortableStyles = sortable ? 'cursor-pointer hover:text-gray-700' : '';

  return (
    <th
      scope={scope}
      aria-sort={sortable ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
      className={`${baseStyles} ${sortableStyles} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <svg className="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={sortDirection === 'asc'
                ? 'M7 11l5-5 5 5'
                : sortDirection === 'desc'
                ? 'M7 13l5 5 5-5'
                : 'M7 11l5-5 5 5 M7 13l5 5 5-5'}
            />
          </svg>
        )}
      </div>
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
};
