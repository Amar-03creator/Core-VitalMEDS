import React from 'react';
const AdminLayout = ({ children }) => (
  <div className="flex min-h-screen">
    <nav className="w-60 bg-slate-900 text-white p-4">
      <h3 className="text-xl font-bold mb-4">Admin Panel</h3>
      {/* Navigation links here */}
    </nav>
    <main className="flex-1 p-5">{children}</main>
  </div>
);
export default AdminLayout;