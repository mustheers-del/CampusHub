import React from 'react';

export default function StatCard({ title, value, description, icon, color = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {description && <span className="stat-desc">{description}</span>}
      </div>
    </div>
  );
}
