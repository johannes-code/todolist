'use client';

import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('../app/home-client'), {
  ssr: false,
});

export default function HomeClientWrapper({ children }) {
  return <HomeClient>{children}</HomeClient>; 
}