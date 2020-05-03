import * as React from "react";
import ECS from ".";

export default {
  title: "ECS",
  component: ECS,
};

export const ECSDemo = () => <ECS name="Test" role="Role" runtime="Node v12" />;
