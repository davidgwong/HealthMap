import { HealthMap } from "./classes/Map.ts";
import { SimpleReport, ComplexReport, ReportMaker } from "./classes/Report.ts";

let currentIntake = 0;

async function buildHealthMap(filePath: string) {
  const map = new HealthMap();
  await map.initializeHealthMap(filePath);
  map.initializeHighLevelMap();
  map.setIntakeAgeThreshold(currentIntake);
  return map;
}

async function main() {
  const map = await buildHealthMap("./data.json");
  map.printMap();
  console.log("---End of Map---");
  map.registerForShots();
  const complexReport = new ReportMaker(new ComplexReport(map));
  complexReport.printDetails();
  console.log("---End of Report---");
  const simpleReport = new ReportMaker(new SimpleReport(map));
  simpleReport.printDetails();
  console.log("---End of Report---");
  map.printMap();
  console.log("---End of Map---");
}

main();
