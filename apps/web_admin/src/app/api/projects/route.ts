import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

const API_URL = process.env.API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // トークンを取得
    const token = request.cookies.get('admin_auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: '認証トークンが見つかりません' },
        { status: 401 }
      );
    }

    // Go APIにリクエスト（自分が所属するプロジェクト一覧）
    const response = await fetch(`${API_URL}/api/projects/me?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'プロジェクト情報の取得に失敗しました' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      projects: data.projects || data,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}