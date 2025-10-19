import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;

	const isAuthPath = path === '/auth/register' || path.startsWith('/auth/login');
	const isRecordingPath = path.startsWith('/record');
	const isFeedbackPath = path.startsWith('/feedback');
	const isHistoryPath = path.startsWith('/history');

	const hasAccessToken = !!request.cookies.get('access_token')?.value;
	const hasRefreshToken = !!request.cookies.get('refresh_token')?.value;
	const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';

	const isLoggedIn = hasAccessToken || hasRefreshToken || isAuthenticated;

	if (isAuthPath && isLoggedIn) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	if (isRecordingPath && !isLoggedIn) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	if (isFeedbackPath && !isLoggedIn) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	if (isHistoryPath && !isLoggedIn) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/auth/register',
		'/auth/login',
		'/record/:path*',
		'/feedback/:path*',
		'/history/:path*',
	],
};