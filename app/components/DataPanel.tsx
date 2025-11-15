"use client";
import DashboardCard from "@/app/components/DashboardCard";
import { Chart, ChartData, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import PendingOrders from "./PendingOrders";

Chart.register(ArcElement, Tooltip, Legend);


const DataPanel = () => {
  const data: ChartData<"doughnut"> = {
    labels: ["Income", "Inventory", "Write-offs"],
    datasets: [
      {
        label: "# of Votes",
        data: [12, 19, 3],
        backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      // title: {
      //   display: true,
      //   text: 'Doughnut Chart Example',
      // },
    },
  };
  return (
    <div className="mb-5 flex gap-5">
      <DashboardCard classNames="px-10">
        <h1 className="font-bold text-2xl">Income</h1>
        <div className="w-60% h-full">
          <Doughnut data={data} options={options} />
        </div>
      </DashboardCard>
      <PendingOrders />
    </div>
  );
};

export default DataPanel;