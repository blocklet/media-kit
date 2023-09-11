// import { lazy } from 'react';

// const Lottie = lazy(() => import('lottie-react'));

import Lottie from 'lottie-react';

export interface LottieProps {
  src: any;
}

export default function LottieComp({ src }: LottieProps) {
  return <Lottie animationData={src} loop />;
}
