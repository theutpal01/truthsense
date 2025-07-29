import { AuthGuard } from '@/services/auth-guard';
import Report from './ReportClient';

export default function ReportPage({ params }: { params: { id: string } }) {
	return (
		<AuthGuard>
			<Report id={params.id} />
		</AuthGuard>
	);
}