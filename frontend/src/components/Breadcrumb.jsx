import React from "react";
import { Link } from "react-router-dom";
import "../styles/ui/Breadcrumb.css";

const Breadcrumb = ({ currentPage, parentLabel, parentPath }) => {
  return (
    <div className="breadcrumb-container">
      <Link to="/" className="breadcrumb-link">INICIO</Link>
      
      {parentLabel && parentPath && (
        <>
          <span className="breadcrumb-separator">/</span>
          <Link to={parentPath} className="breadcrumb-link">{parentLabel}</Link>
        </>
      )}

      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-current">{currentPage}</span>
    </div>
  );
};

export default Breadcrumb;