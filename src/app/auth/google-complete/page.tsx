import { Suspense } from 'react';
import GoogleCompleteClient from './GoogleCompleteClient';
export default function GoogleCompletePage(){return <Suspense fallback={<p className="p-10 text-center">Checking account…</p>}><GoogleCompleteClient/></Suspense>}
