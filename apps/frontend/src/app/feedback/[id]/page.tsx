import Report from './ReportClient';

export default async function ReportPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params;
	return <Report id={id} />;
}
