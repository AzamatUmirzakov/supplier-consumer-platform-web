import DataPanel from "@/app/components/DataPanel";
import DataChart from "./components/DataChart";

export default function Home() {
  return (
    <div className="py-5 px-10 flex-1">
      <DataPanel />
      <DataChart />
    </div>
  );
}
