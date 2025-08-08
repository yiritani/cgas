import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const COOKIE_NAME = 'admin_auth_token';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiUrl = `${API_URL}/api/admin/csp-accounts/${params.id}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      console.error(`URL: ${apiUrl}`);
      
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('CSP account detail proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const apiUrl = `${API_URL}/api/admin/csp-accounts/${params.id}`;
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      console.error(`URL: ${apiUrl}`);
      
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('CSP account update proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiUrl = `${API_URL}/api/admin/csp-accounts/${params.id}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      console.error(`URL: ${apiUrl}`);
      
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    // DELETE might return empty response
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('CSP account delete proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}