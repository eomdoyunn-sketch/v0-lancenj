import React, { useState } from 'react';
import { User, Branch } from '../types';
import { AuthService } from '../lib/authService';

interface AuthProps {
  allBranches: Branch[];
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'signup' | 'forgot';

export const Auth: React.FC<AuthProps> = ({ allBranches, onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (view === 'login') {
      const { user, error } = await AuthService.login(email, password);
      if (error) {
        setError(error);
      } else if (user) {
        onLogin(user);
      }
    } else if (view === 'signup') {
        const name = formData.get('name') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const branchId = formData.get('branchId') as string;

        if (!branchId) {
            setError('소속 지점을 선택해주세요.');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        const { user, error } = await AuthService.signup(name, email, password, branchId);
        if (error) {
            setError(error);
        } else {
            setSuccess('회원가입이 완료되었습니다. 관리자 승인 후 로그인해주세요.');
            setView('login');
        }
    } else if (view === 'forgot') {
        setError('비밀번호 재설정 기능은 현재 지원되지 않습니다. 관리자에게 문의하세요.');
    }
    setLoading(false);
  };

  const renderForm = () => {
    switch(view) {
      case 'signup':
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">회원가입</h2>
            <p className="text-sm text-gray-500 text-center mt-1">LANCE&J 계정을 생성합니다.</p>
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="text" name="name" placeholder="이름" required />
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="email" name="email" placeholder="이메일" required />
             <select name="branchId" defaultValue="" required className="w-full p-3 mt-4 border border-gray-300 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option value="" disabled>-- 소속 지점 선택 --</option>
                {allBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="password" name="password" placeholder="비밀번호" required />
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="password" name="confirmPassword" placeholder="비밀번호 확인" required />
            <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-md font-semibold hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200" type="submit" disabled={loading}>
              {loading ? '처리 중...' : '가입하기'}
            </button>
            <p className="text-center mt-4 text-sm text-gray-600">
              이미 계정이 있으신가요? <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="text-orange-600 hover:text-orange-700 hover:underline">로그인</button>
            </p>
          </>
        );
      case 'forgot':
        return (
           <>
            <h2 className="text-2xl font-bold text-center text-gray-800">비밀번호 찾기</h2>
            <p className="text-sm text-gray-500 text-center mt-1">계정 이메일로 비밀번호 재설정 링크를 보내드립니다.</p>
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="email" name="email" placeholder="이메일" required />
            <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-md font-semibold hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200" type="submit" disabled={loading}>
                {loading ? '처리 중...' : '재설정 링크 받기'}
            </button>
             <p className="text-center mt-4 text-sm text-gray-600">
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="text-orange-600 hover:text-orange-700 hover:underline">로그인으로 돌아가기</button>
            </p>
          </>
        );
      case 'login':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">로그인</h2>
            <p className="text-sm text-gray-500 text-center mt-1">LANCE&J에 오신 것을 환영합니다.</p>
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="email" name="email" placeholder="이메일" required />
            <input className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" type="password" name="password" placeholder="비밀번호" required />
            <div className="text-right mt-2">
                <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="text-sm text-orange-600 hover:text-orange-700 hover:underline">비밀번호를 잊으셨나요?</button>
            </div>
            <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-md font-semibold hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200" type="submit" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
            </button>
            <p className="text-center mt-4 text-sm text-gray-600">
              계정이 없으신가요? <button type="button" onClick={() => { setView('signup'); setError(''); setSuccess(''); }} className="text-orange-600 hover:text-orange-700 hover:underline">가입하기</button>
            </p>
          </>
        );
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-100 p-4">
      <div className="max-w-md w-full">
        {/* LANCE&J 회사명 */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            LANCE & J<sup className="text-xs">®</sup>
          </h1>
          <p className="text-sm text-slate-600 font-medium">SINCE 2005</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit}>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</p>}
            {success && <p className="bg-green-100 text-green-700 p-3 rounded text-sm mb-4">{success}</p>}
            {renderForm()}
          </form>
        </div>
      </div>
    </div>
  );
};
