import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const AnimatedContent = ({
  children,
  distance = 60,
  direction = "vertical", // 'vertical' o 'horizontal'
  reverse = false, // true para invertir dirección (arriba/abajo o izq/der)
  duration = 0.8,
  delay = 0,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1, // Puedes poner 0.95 para un sutil zoom-in
  threshold = 0.15, // Porcentaje visible para activar la animación
  once = true, // true: anima una sola vez; false: anima cada vez que entra en pantalla
  className = "",
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  // Cálculo de desplazamiento inicial
  const axis = direction === "horizontal" ? "x" : "y";
  const offset = reverse ? -distance : distance;

  const initialTransform = {
    [axis]: offset,
    opacity: animateOpacity ? initialOpacity : 1,
    scale: scale !== 1 ? scale : 1,
  };

  const animateTransform = {
    [axis]: 0,
    opacity: 1,
    scale: 1,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initialTransform}
      animate={isInView ? animateTransform : initialTransform}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1], // Curva cúbica suave tipo editorial
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;
