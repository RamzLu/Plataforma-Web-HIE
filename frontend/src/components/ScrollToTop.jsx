import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  // Extraemos la ruta actual (pathname)
  const { pathname } = useLocation();

  // Cada vez que el pathname cambie, ejecutamos el scroll hacia arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
