import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconAlertCircle,
  IconCircleDashedCheck,
  IconFolder,
  IconHourglassHigh,
  IconUserScan,
} from "@tabler/icons-react";
import { usePrivy } from "@privy-io/react-auth";
import MetricsCard from "./MetricsCard";
import { useStateContext } from "../context";

const DisplayInfo = () => {
  const navigate = useNavigate();
  const { user } = usePrivy();

  const { fetchUserRecords, records, fetchUserByEmail } = useStateContext();

  const [metrics, setMetrics] = useState({
    totalFolders: 0,
    aiPersonalizedTreatment: 0,
    totalScreenings: 0,
    completedScreenings: 0,
    pendingScreenings: 0,
    overdueScreenings: 0,
  });

  // fetch user + records
  useEffect(() => {
    if (user) {
      fetchUserByEmail(user.email.address);
      fetchUserRecords(user.email.address);
    }
  }, [user]);

  // calculate metrics when records update
  useEffect(() => {
    const totalFolders = records.length;

    let totalScreenings = 0;
    let completedScreenings = 0;
    let pendingScreenings = 0;

    records.forEach((record) => {
      if (record.kanbanRecords) {
        try {
          const kanban = JSON.parse(record.kanbanRecords);

          totalScreenings += kanban.tasks.length;

               kanban.tasks.forEach((task) => {

  if (task.columnId === "done") {
    completedScreenings++;
  } 
  else {
    pendingScreenings++;
  }

});

          pendingScreenings += kanban.tasks.filter(
            (task) =>
              task.columnId === "todo" || task.columnId === "doing"
          ).length;
        } catch (error) {
          console.error("Failed to parse kanbanRecords:", error);
        }
      }
    });

    setMetrics({
      totalFolders,
      totalScreenings,
      completedScreenings,
      pendingScreenings,
      overdueScreenings: 0,
      aiPersonalizedTreatment: 0,
    });
  }, [records]);

  const metricsData = [
    {
      title: "Treatment Progress Update",
      subtitle: "View",
      value: metrics.totalScreenings,
      icon: IconCircleDashedCheck,
      onClick: () => navigate("/screening-schedules"),
    },
    {
      title: "Total Folders",
      subtitle: "View",
      value: metrics.totalFolders,
      icon: IconFolder,
      onClick: () => navigate("/medical-records"),
    },
    {
      title: "Total Screenings",
      subtitle: "View",
      value: metrics.totalScreenings,
      icon: IconUserScan,
      onClick: () => navigate("/screening-schedules"),
    },
    {
      title: "Completed Screenings",
      subtitle: "View",
      value: metrics.completedScreenings,
      icon: IconCircleDashedCheck,
      onClick: () => navigate("/screening-schedules"),
    },
    {
      title: "Pending Screenings",
      subtitle: "View",
      value: metrics.pendingScreenings,
      icon: IconHourglassHigh,
      onClick: () => navigate("/screenings/pending"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-[26px]">
      <div className="mt-7 grid w-full gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
        {metricsData.slice(0, 2).map((metric) => (
          <MetricsCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="mt-[9px] grid w-full gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {metricsData.slice(2).map((metric) => (
          <MetricsCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default DisplayInfo;