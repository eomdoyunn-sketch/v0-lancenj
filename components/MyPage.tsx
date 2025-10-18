import React, { useState, useEffect } from 'react';
import { User, Trainer, Session, MemberProgram, Member, Branch } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useResponsive } from '../hooks/useResponsive';
import { MyPageContainer } from './layout/Container';
import { Grid } from './layout/Grid';
import { Flex } from './layout/Flex';
import { EditIcon, PlusIcon, CalendarIcon, UserIcon, SettingsIcon } from './Icons';

interface MyPageProps {
  currentUser: User | null;
  trainers: Trainer[];
  sessions: Session[];
  programs: MemberProgram[];
  members: Member[];
  branches: Branch[];
  auditLogs: any[];
  onEditProfile: () => void;
  onAddSession: () => void;
  onEditSession: (session: Session) => void;
  onCompleteSession: (session: Session) => void;
}

export const MyPage: React.FC<MyPageProps> = ({
  currentUser,
  trainers,
  sessions,
  programs,
  members,
  branches,
  auditLogs,
  onEditProfile,
  onAddSession,
  onEditSession,
  onCompleteSession
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 현재 사용자의 강사 프로필
  const trainerProfile = currentUser?.trainerProfileId 
    ? trainers.find(t => t.id === currentUser.trainerProfileId)
    : null;

  // 오늘의 세션들
  const todaySessions = sessions.filter(session => 
    session.date === selectedDate && 
    session.trainerId === currentUser?.trainerProfileId
  );

  // 이번 주 세션들
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= weekStart && 
           sessionDate <= weekEnd && 
           session.trainerId === currentUser?.trainerProfileId;
  });

  // 완료된 세션 수
  const completedSessions = weekSessions.filter(s => s.status === 'completed').length;
  const totalSessions = weekSessions.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">완료</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">예약</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM 형식으로 변환
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || '알 수 없음';
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.programName || '알 수 없음';
  };

  return (
    <div className="flex-1 p-4 sm:p-6 bg-slate-100 overflow-y-auto">
      <MyPageContainer>
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>
                마이페이지
              </h1>
              <p className="text-slate-500 mt-1">
                {trainerProfile?.name || currentUser?.name}님의 개인 관리 페이지입니다.
              </p>
            </div>
            <Button onClick={onEditProfile} className="w-full sm:w-auto">
              <SettingsIcon className="w-4 h-4" />
              프로필 수정
            </Button>
          </div>
        </div>

        {/* 사용자 프로필 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              프로필 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">이름</label>
                  <p className="text-lg font-semibold text-slate-800">
                    {trainerProfile?.name || currentUser?.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">역할</label>
                  <div className="mt-1">
                    <Badge variant={currentUser?.role === 'admin' ? 'default' : 'secondary'}>
                      {currentUser?.role === 'admin' ? '관리자' : 
                       currentUser?.role === 'manager' ? '매니저' : 
                       currentUser?.role === 'trainer' ? '강사' : '사용자'}
                    </Badge>
                  </div>
                </div>
                {trainerProfile && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">강사 색상</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-slate-300" 
                        style={{ backgroundColor: trainerProfile.color }}
                      ></div>
                      <span className="text-sm text-slate-600">{trainerProfile.color}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">소속 지점</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentUser?.role === 'trainer' && trainerProfile ? (
                      // 강사인 경우 trainerProfile의 branchIds 사용
                      trainerProfile.branchIds?.map(branchId => {
                        const branch = branches.find(b => b.id === branchId);
                        return branch ? (
                          <Badge key={branchId} variant="outline">{branch.name}</Badge>
                        ) : null;
                      }) || <span className="text-slate-500">지점 정보 없음</span>
                    ) : (
                      // 관리자/매니저인 경우 currentUser의 assignedBranchIds 사용
                      currentUser?.assignedBranchIds?.map(branchId => {
                        const branch = branches.find(b => b.id === branchId);
                        return branch ? (
                          <Badge key={branchId} variant="outline">{branch.name}</Badge>
                        ) : null;
                      }) || <span className="text-slate-500">지점 정보 없음</span>
                    )}
                  </div>
                </div>
                {trainerProfile && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">상태</label>
                    <div className="mt-1">
                      <Badge variant={trainerProfile.isActive ? 'default' : 'destructive'}>
                        {trainerProfile.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 내역 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>최근 활동 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs
                .filter(log => log.user_id === currentUser?.id)
                .slice(0, 5)
                .map((log, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{log.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.action_type}
                    </Badge>
                  </div>
                ))}
              {auditLogs.filter(log => log.user_id === currentUser?.id).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>최근 활동 내역이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 오늘의 PT 블록 - 가장 중요 */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              오늘의 PT 세션
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
                <Button onClick={onAddSession} size="sm" className="h-8">
                  <PlusIcon className="w-4 h-4" />
                  세션 추가
                </Button>
              </div>
              <div className="text-sm text-slate-600">
                총 {todaySessions.length}개 세션
              </div>
            </div>

            {todaySessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">오늘 예정된 세션이 없습니다.</p>
                <p className="text-sm mt-1">새로운 세션을 추가해보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map(session => (
                  <div
                    key={session.id}
                    className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onEditSession(session)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800">
                            {getMemberName(session.memberId)}
                          </h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {getProgramName(session.programId)} - {session.sessionNumber}회차
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {session.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompleteSession(session);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            완료
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSession(session);
                          }}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 주간 통계 */}
        <Grid cols={2} gap="lg" className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-600">이번 주 완료율</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-600">
                {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {completedSessions}/{totalSessions} 세션 완료
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-600">이번 주 수업료</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600">
                ₩{weekSessions
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => {
                    const program = programs.find(p => p.id === s.programId);
                    return sum + (program?.unitPrice || 0);
                  }, 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-slate-500 mt-1">완료된 세션 기준</p>
            </CardContent>
          </Card>
        </Grid>

        {/* 이번 주 세션 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">이번 주 세션 목록</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {weekSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>이번 주 예정된 세션이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>시간</TableHead>
                      <TableHead>회원</TableHead>
                      <TableHead>프로그램</TableHead>
                      <TableHead>회차</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekSessions.map(session => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.date}</TableCell>
                        <TableCell>{formatTime(session.startTime)}</TableCell>
                        <TableCell>{getMemberName(session.memberId)}</TableCell>
                        <TableCell>{getProgramName(session.programId)}</TableCell>
                        <TableCell>{session.sessionNumber}회차</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {session.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => onCompleteSession(session)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                완료
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditSession(session)}
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </MyPageContainer>
    </div>
  );
};
