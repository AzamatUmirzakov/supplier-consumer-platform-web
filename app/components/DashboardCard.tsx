const DashboardCard = ({ classNames, children }: { children: React.ReactNode, classNames?: string }) => {
  return (
    <div className={`bg-[#1a1a1a] shadow-md rounded-lg p-6 ${classNames}`}>
      {children}
    </div>
  );
};

export default DashboardCard;