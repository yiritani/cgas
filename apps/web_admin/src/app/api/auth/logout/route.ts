import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // レスポンスを作成してCookieを削除
    const response = NextResponse.json({
      success: true,
      message: 'ログアウトしました',
    });

    clearAuthCookie(response);

    return response;
  } catch (error) {
    console.error('Logout route error:', error);
    return NextResponse.json(
      { success: false, error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
}