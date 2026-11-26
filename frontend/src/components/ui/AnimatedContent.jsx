import { useRef, useMemo } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const AnimatedContent = ({
  children,
  distance = 28,
  direction = "vertical", // 'vertical' o 'horizontal'
  reverse = false, // true para invertir dirección (arriba/abajo o izq/der)
  duration = 0.5,
  delay = 0,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  once = true, // true: anima una sola vez; false: anima cada vez que entra en pantalla
  className = "",
}) => {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // "some" evita que bloques altos o en pantalla dividida queden trabados en opacity: 0
  // y el margen vertical pre-dispara la entrada justo antes de aparecer en pantalla.
  const isInView = useInView(ref, {
    once,
    amount: "some",
    margin: "40px 0px 40px 0px",
  });

  const clampedDistance = Math.min(Math.abs(distance), 32);
  const clampedDuration = Math.min(duration, 0.55);
  const clampedDelay = Math.min(delay, 0.25);

  const initialTransform = useMemo(() => {
    const axis = direction === "horizontal" ? "x" : "y";
    const offset = reverse ? -clampedDistance : clampedDistance;
    return {
      [axis]: offset,
      opacity: animateOpacity ? initialOpacity : 1,
      scale: scale !== 1 ? scale : 1,
    };
  }, [direction, reverse, clampedDistance, animateOpacity, initialOpacity, scale]);

  const animateTransform = useMemo(() => {
    const axis = direction === "horizontal" ? "x" : "y";
    return {
      [axis]: 0,
      opacity: 1,
      scale: 1,
    };
  }, [direction]);

  const transition = useMemo(
    () => ({
      duration: clampedDuration,
      delay: clampedDelay,
      ease: [0.25, 0.1, 0.25, 1],
    }),
    [clampedDuration, clampedDelay]
  );

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initialTransform}
      animate={isInView ? animateTransform : initialTransform}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;
