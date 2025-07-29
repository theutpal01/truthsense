"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAPI';

interface Props {
	children: React.ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const [checked, setChecked] = useState(false); // ✅ avoid premature redirect

	useEffect(() => {
		if (!isLoading) {
			if (!isAuthenticated) {
				router.replace('/auth/login');
			} else {
				setChecked(true); // ✅ allow render only if authenticated
			}
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading || !checked) {
		return (
			<div className="h-screen flex items-center justify-center">
				<p>Checking auth info...</p>
			</div>
		);
	}

	return <>{children}</>;
};
