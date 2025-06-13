import type { NodesEdgesData } from "./types";

declare module "*.json" {
  const value: NodesEdgesData;
  export default value;
}
