import { lazy } from 'react';

const Lottie = lazy(() => import('@lottiefiles/react-lottie-player').then((mod) => ({ default: mod.Player })));

export interface LottieProps {
  src: any;
}

export default function LottieComp({ src }: LottieProps) {
  return <Lottie src={src} loop autoplay />;
}
