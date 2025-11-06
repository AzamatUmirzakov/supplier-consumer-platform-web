"use client";
import DashboardCard from "@/components/DashboardCard/DashboardCard";
import { Chart, ChartData, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

Chart.register(ArcElement, Tooltip, Legend);


const DataPanel = () => {
  const data: ChartData<"doughnut"> = {
    labels: ["Red", "Blue", "Yellow"],
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
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Doughnut Chart Example',
      },
    },
  };
  return (
    <div>
      <DashboardCard>
        <h2>Data Panel</h2>
        <Doughnut data={data} options={options} />
      </DashboardCard>
    </div>
  );
};

export default DataPanel;