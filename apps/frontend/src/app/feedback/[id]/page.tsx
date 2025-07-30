import { AuthGuard } from '@/services/auth-guard';
import Report from './ReportClient';
import { type FC } from 'react';

const ReportPage: FC<{ params: { id: string } }> = ({ params }) => {
	return (
		<AuthGuard>
			<Report id={params.id} />
		</AuthGuard>
	);
};

export default ReportPage;
