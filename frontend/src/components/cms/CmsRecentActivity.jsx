import React from "react";
import { recentActivityData } from "../../data/recentActivityData";

const CmsRecentActivity = () => {
  return (
    <div className="cms-dashboard-card recent-activity-card">
      <div className="recent-activity-header">
        <h3 className="cms-card-title">Actividad reciente</h3>
        <p className="recent-activity-subtitle">
          Registro de acciones del editor.
        </p>
      </div>

      <div className="recent-activity-table">
        <div className="activity-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-fecha">FECHA</div>
        </div>

        <div className="activity-table-body">
          {recentActivityData.map((item) => (
            <div className="activity-row" key={item.id}>
              <div className="col-content">
                <span className="activity-title">• {item.titulo}</span>
                <span className="activity-meta">
                  {item.hora} | {item.categoria}
                </span>
              </div>
              <div className="col-editor" data-label="Editor">
                {item.editor}
              </div>
              <div className="col-estado" data-label="Estado">
                <span className={`status-badge ${item.estado.toLowerCase()}`}>
                  {item.estado}
                </span>
              </div>
              <div className="col-fecha" data-label="Fecha">
                {item.fecha}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CmsRecentActivity;
