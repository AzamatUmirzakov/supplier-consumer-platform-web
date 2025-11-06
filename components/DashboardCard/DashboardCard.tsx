const DashboardCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-gray-950 shadow-md rounded-lg p-6">
      {children}
    </div>
  );
};

export default DashboardCard;