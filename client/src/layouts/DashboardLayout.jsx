import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
