import { redirect } from 'next/navigation';

// Live Monitoring now lives inside Analytics & Reports as a dedicated tab.
export default function MonitorRedirect() {
  redirect('/admin/reports');
}
