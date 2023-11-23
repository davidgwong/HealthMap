import { HealthMap } from "./Map.ts";

let currentIntake = 50;

async function buildHealthMap(filePath: string) {
  const map = new HealthMap();
  await map.initializeHealthMap(filePath);
  map.setIntakeAgeThreshold(currentIntake);
  return map;
}

async function main() {
  const map = await buildHealthMap("./data.json");
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
