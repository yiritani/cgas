import { NextRequest, NextResponse } from 'next/server';
import { loginToAPI, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('BFF login API called');
  
  try {
    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt for email:', email);

    // バリデーション
    if (!email || !password) {
      console.log('Login validation failed - missing email or password');
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // Go APIにログインリクエスト
    console.log('Calling Go API for login');
    const authResult = await loginToAPI(email, password);
    console.log('Go API login result:', authResult);

    if (!authResult.success || !authResult.token) {
      console.log('Go API login failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || 'ログインに失敗しました' },
        { status: 401 }
      );
    }

    // レスポンスを作成してCookieを設定
    console.log('Login successful, setting cookie and creating response');
    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    });

    setAuthCookie(response, authResult.token);
    console.log('Cookie set, returning response');

    return response;
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}