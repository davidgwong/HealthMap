import { HealthMap } from "./Map.ts";

let currentIntake = 30;

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
  console.log(map._HouseholdMap.get("0-0"));
  console.log(map._ClinicMap.get("0-3"));
  map.registerForShots();
  console.log(map._HouseholdMap.get("0-0"));
  console.log(map._ClinicMap.get("0-3"));
  // const report = new ReportMaker(new ComplexReport(map));
  // report.printDetails();
  // console.log("---End of Report---")
  // map.printMap();
  // console.log("---End of Map---")
}

main();
