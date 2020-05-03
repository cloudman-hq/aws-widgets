import * as React from "react";
import ECS from ".";

export default {
  title: "ECS",
  component: ECS,
};

export const ECSDemo = () => (
  <ECS clusterName="Test" services="Role" tasks="Node v12" />
);
