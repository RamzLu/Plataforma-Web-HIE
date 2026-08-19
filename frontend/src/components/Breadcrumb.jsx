import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/Breadcrumb.css";

const Breadcrumb = ({ currentPage }) => {
  return (
    <div className="breadcrumb-container">
      <Link to="/" className="breadcrumb-link">
        INICIO
      </Link>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-current">{currentPage}</span>
    </div>
  );
};

export default Breadcrumb;
