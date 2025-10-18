import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface ResponsiveTableColumn {
  key: string;
  label: string;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (value: any, item: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[];
  data: any[];
  keyExtractor: (item: any) => string;
  onRowClick?: (item: any) => void;
  actions?: {
    edit?: (item: any) => void;
    delete?: (item: any) => void;
    custom?: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: (item: any) => void;
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    }>;
  };
  emptyMessage?: string;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  keyExtractor,
  onRowClick,
  actions,
  emptyMessage = "데이터가 없습니다.",
  className = ''
}) => {
  const renderMobileCard = (item: any) => (
    <Card key={keyExtractor(item)} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {columns[0]?.render ? columns[0].render(item[columns[0].key], item) : item[columns[0]?.key]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-slate-600">
          {columns.slice(1).map(column => (
            <div key={column.key}>
              <p className="font-medium mb-1">{column.label}:</p>
              <div>
                {column.render ? column.render(item[column.key], item) : item[column.key]}
              </div>
            </div>
          ))}
        </div>
        {actions && (
          <div className="flex items-center justify-end gap-2 mt-4">
            {actions.edit && (
              <Button variant="ghost" size="icon-sm" onClick={() => actions.edit!(item)} title="수정">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            {actions.delete && (
              <Button variant="ghost" size="icon-sm" onClick={() => actions.delete!(item)} title="삭제">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
            {actions.custom?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'ghost'}
                size="icon-sm"
                onClick={() => action.onClick(item)}
                title={action.label}
              >
                {action.icon}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTabletColumns = () => columns.filter(col => !col.hideOnTablet);
  const renderDesktopColumns = () => columns.filter(col => !col.hideOnMobile);

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", className)}>
      {/* 데스크톱 테이블 */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {renderDesktopColumns().map(column => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
              {actions && <TableHead className="text-center">관리</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow 
                key={keyExtractor(item)} 
                className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {renderDesktopColumns().map(column => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {actions.edit && (
                        <Button variant="ghost" size="icon-sm" onClick={() => actions.edit!(item)} title="수정">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      )}
                      {actions.delete && (
                        <Button variant="ghost" size="icon-sm" onClick={() => actions.delete!(item)} title="삭제">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 태블릿 테이블 */}
      <div className="hidden sm:block lg:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {renderTabletColumns().map(column => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
              {actions && <TableHead className="text-center">관리</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow 
                key={keyExtractor(item)} 
                className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {renderTabletColumns().map(column => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {actions.edit && (
                        <Button variant="ghost" size="icon-sm" onClick={() => actions.edit!(item)} title="수정">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      )}
                      {actions.delete && (
                        <Button variant="ghost" size="icon-sm" onClick={() => actions.delete!(item)} title="삭제">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="sm:hidden space-y-4 p-4">
        {data.map(item => renderMobileCard(item))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-16 px-6">
          <h3 className="text-lg font-semibold text-slate-700">{emptyMessage}</h3>
        </div>
      )}
    </div>
  );
};
