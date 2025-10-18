import React from 'react';
import { Trainer, Branch, BranchRate } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';
import { CenteredContainer } from './layout/Container';
import { useResponsive } from '../hooks/useResponsive';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TrainerManagementProps {
  trainers: Trainer[];
  allBranches: Branch[];
  onAddTrainer: () => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (trainerId: string) => void;
}

export const TrainerManagement: React.FC<TrainerManagementProps> = ({ trainers, allBranches, onAddTrainer, onEditTrainer, onDeleteTrainer }) => {
  const { isMobile, isTablet } = useResponsive();
  const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

  const formatRate = (rate: BranchRate) => {
    if (rate.type === 'percentage') {
      return `${(rate.value * 100).toFixed(0)}%`;
    }
    return `${rate.value.toLocaleString()}원`;
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ backgroundColor: '#F1F5F9' }}>
      <CenteredContainer>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>강사 관리</h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">센터의 모든 강사 정보를 관리합니다.</p>
          </div>
          <Button onClick={onAddTrainer} className="w-full sm:w-auto">
            <PlusIcon className="w-4 h-4" />
            신규 강사 추가
          </Button>
        </div>
        <Card className="overflow-hidden">
          {/* 데스크톱 테이블 */}
          <div className="hidden lg:block">
            <Table style={{ backgroundColor: '#FFFFFF' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-4 font-semibold text-slate-600">강사명</TableHead>
                  <TableHead className="p-4 font-semibold text-slate-600">색상</TableHead>
                  <TableHead className="p-4 font-semibold text-slate-600">상태</TableHead>
                  <TableHead className="p-4 font-semibold text-slate-600">지점별 수업료</TableHead>
                  <TableHead className="p-4 font-semibold text-slate-600">소속 지점</TableHead>
                  <TableHead className="p-4 font-semibold text-slate-600 text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map(trainer => (
                  <TableRow key={trainer.id}>
                    <TableCell className="p-4 font-medium text-slate-800">{trainer.name}</TableCell>
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: trainer.color }}></div>
                        <span className="text-sm text-slate-600">{trainer.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge variant={trainer.isActive ? 'default' : 'destructive'}>
                        {trainer.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-slate-600">
                      {Object.entries(trainer.branchRates).map(([branchId, rate]) => (
                        <div key={branchId} className="mb-1">
                          <span className="font-medium">{branchMap.get(branchId)}:</span> {formatRate(rate)}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="p-4 text-sm text-slate-600">
                      {trainer.branchIds.map(branchId => branchMap.get(branchId)).join(', ')}
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => onEditTrainer(trainer)} title="수정">
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onDeleteTrainer(trainer.id)} title="삭제">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 태블릿 테이블 */}
          <div className="hidden sm:block lg:hidden">
            <Table style={{ backgroundColor: '#FFFFFF' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-3 font-semibold text-slate-600">강사명</TableHead>
                  <TableHead className="p-3 font-semibold text-slate-600">상태</TableHead>
                  <TableHead className="p-3 font-semibold text-slate-600">소속 지점</TableHead>
                  <TableHead className="p-3 font-semibold text-slate-600 text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map(trainer => (
                  <TableRow key={trainer.id}>
                    <TableCell className="p-3 font-medium text-slate-800">{trainer.name}</TableCell>
                    <TableCell className="p-3">
                      <Badge variant={trainer.isActive ? 'default' : 'destructive'}>
                        {trainer.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-sm text-slate-600">
                      {trainer.branchIds.map(branchId => branchMap.get(branchId)).join(', ')}
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => onEditTrainer(trainer)} title="수정">
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onDeleteTrainer(trainer.id)} title="삭제">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 모바일 카드 뷰 */}
          <div className="sm:hidden space-y-4 p-4">
            {trainers.map(trainer => (
              <Card key={trainer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{trainer.name}</CardTitle>
                    <Badge variant={trainer.isActive ? 'default' : 'destructive'}>
                      {trainer.isActive ? '활성' : '비활성'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-slate-600">
                    <div>
                      <p className="font-medium mb-1">소속 지점:</p>
                      <p>{trainer.branchIds.map(branchId => branchMap.get(branchId)).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: trainer.color }}></div>
                      <span>색상: {trainer.color}</span>
                    </div>
                    <div>
                      <p className="font-medium mb-2">지점별 수업료:</p>
                      <div className="space-y-1">
                        {Object.entries(trainer.branchRates).map(([branchId, rate]) => (
                          <div key={branchId} className="text-xs bg-slate-50 p-2 rounded">
                            <strong>{branchMap.get(branchId)}:</strong> {formatRate(rate)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => onEditTrainer(trainer)} title="수정">
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => onDeleteTrainer(trainer.id)} title="삭제">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {trainers.length === 0 && (
            <div className="text-center py-16 px-6">
              <h3 className="text-lg font-semibold text-slate-700">등록된 강사가 없습니다.</h3>
              <p className="text-slate-500 mt-2">'신규 강사 추가' 버튼을 눌러 새 강사를 등록하세요.</p>
            </div>
          )}
        </Card>
      </CenteredContainer>
    </div>
  );
};