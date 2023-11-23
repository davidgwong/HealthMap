import { HealthMap } from "./Map.ts";

async function main() {
  const map = new HealthMap();
  await map.initializeHealthMap("./data.json");
  map.printMap();
  console.log("---End of Map---");
  // map.registerForShots();
  // const report = new ReportMaker(new ComplexReport(map));
  // report.printDetails();
  // console.log("---End of Report---")
  // map.printMap();
  // console.log("---End of Map---")
}

main();
