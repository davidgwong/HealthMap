import fs from "fs/promises";
import { City, Cities, BlockInfo } from "./types";
import { DecoratedClinic } from "./Clinic";
import { DecoratedHousehold } from "./Household";

class HealthMap {
  private _cities: Cities;
  private _blocksInLargestCity: number;
  private _intakeAgeThreshold: number;
  private _highLevelMap: BlockInfo[][];
  private _HouseholdMap: Map<string, DecoratedHousehold>;
  private _ClinicMap: Map<string, DecoratedClinic>;

  constructor() {
    this._cities = {} as Cities;
    this._blocksInLargestCity = 0;
    this._intakeAgeThreshold = 0;
    this._highLevelMap = [];
    this._HouseholdMap = new Map();
    this._ClinicMap = new Map();
  }

  public async initializeHealthMap(filePath: string) {
    return fs
      .readFile(filePath, { encoding: "utf-8" })
      .then((fileData) => JSON.parse(fileData))
      .then((parsedData) => {
        this._cities = parsedData.city;
        this._blocksInLargestCity = Math.max(
          this._cities.Burnaby.households.length +
            this._cities.Burnaby.clinics.length,
          this._cities.Vancouver.households.length +
            this._cities.Vancouver.clinics.length,
          this._cities.Richmond.households.length +
            this._cities.Richmond.clinics.length
        );
      });
  }

  public setIntakeAgeThreshold(age: number) {
    this._intakeAgeThreshold = age;
  }

  public getIntakeAgeThreshold() {
    return this._intakeAgeThreshold;
  }

  public getHighLevelMap() {
    return this._highLevelMap;
  }

  public getClinicMap() {
    return this._ClinicMap;
  }

  public getHouseholdMap() {
    return this._HouseholdMap;
  }

  /*
   * initializeCityMap() initializes the HealthMap of each city.
   * It initializes the city's highLevelMap to determine if a block a fully vaccinated household, partially vaccinated household, or a clinic.
   * Then, it sets the HouseholdMap and ClinicMap's map data structure with the key-value of (cityNum)-(blockNum): DecoratedHousehold | DecoratedClinic.
   * highLevelMap uses a data structure of [][] for O(1) access. Then, we can search the corresponding block's value with average O(1) search.
   * Separate map data structure for Households and Clinics so that we don't need to do filtering.
   */
  private initializeCityMap(
    city: City,
    cityIndex: number,
    blocksInLargestCity: number
  ) {
    let cityMap: BlockInfo[] = Array(blocksInLargestCity).fill({
      label: "x",
    });
    city.households.forEach((household) => {
      let foundUnvaccinatedPerson = household.inhabitants.find(
        (person) => person.isVaccinated == false
      );
      if (foundUnvaccinatedPerson) {
        cityMap[household.blockNum] = {
          label: "H",
        };
      } else {
        cityMap[household.blockNum] = {
          label: "F",
        };
      }
      this._HouseholdMap.set(
        cityIndex + "-" + household.blockNum,
        new DecoratedHousehold(household)
      );
    });
    city.clinics.forEach((clinic) => {
      cityMap[clinic.blockNum] = {
        label: "C",
      };
      this._ClinicMap.set(
        cityIndex + "-" + clinic.blockNum,
        new DecoratedClinic(clinic)
      );
    });
    return cityMap;
  }

  private initializeHighLevelMap() {
    this._highLevelMap[0] = this.initializeCityMap(
      this._cities.Burnaby,
      0,
      this._blocksInLargestCity
    );
    this._highLevelMap[1] = this.initializeCityMap(
      this._cities.Vancouver,
      1,
      this._blocksInLargestCity
    );
    this._highLevelMap[2] = this.initializeCityMap(
      this._cities.Richmond,
      2,
      this._blocksInLargestCity
    );
  }

  /* 
  H,F,F,C,C,C // Burnaby
  H,F,C,x,x,x // Vancouver
  H,C,F,x,x,x // Richmond

  The "H" symbols on the map represent Households that still have some members unvaccinated.
  The "F" symbols on the map represent Households that have all members vaccinated. 
  The "C" symbols on the map represent Clinics.
  */
  public printMap() {
    this.initializeHighLevelMap();
    this._highLevelMap.forEach((city) => {
      let printout = "";
      city.forEach((block) => {
        printout += block.label + " ";
      });
      console.log(printout);
    });
  }

  /*
   * Set nearest Clinic for each Household once to save time in case there is more than one registerForShots() called.
   */
  private setHouseholdNearestClinic(
    currHouseholdBlock: number,
    city: BlockInfo[]
  ) {
    let left = 0;
    let right = currHouseholdBlock + 1;
    if (currHouseholdBlock > 0) left = currHouseholdBlock - 1;
    if (currHouseholdBlock > city.length - 1) right = currHouseholdBlock;
    while (city[left].label !== "C" && city[right].label !== "C") {
      if (left > 0) left -= 1;
      if (right < city.length - 1) right += 1;
    }
    if (city[left].label == "C") return left;
    else return right;
  }

  /*
    Go through each member all Households within each city: 
    - Check if a person isVaccinated already or not. If they are already vaccinated, skip them.
    - If a person is NOT vaccinated, check if their age meets the currentIntake age. If it does not, skip them.
    - If a person is NOT vaccinated and their age meets the currentIntake age, you must do the following:
      -- Add the person to the nearest available clinic (queue).
      -- That person's isVaccinated status is set to true.
  */
  public registerForShots() {
    function nearestClinicIndex(currBlock: number, city: BlockInfo[]) {
      let left = 0;
      let right = currBlock + 1;
      if (currBlock > 0) left = currBlock - 1;
      if (currBlock > city.length - 1) right = currBlock;
      while (city[left].label !== "C" && city[right].label !== "C") {
        if (left > 0) left -= 1;
        if (right < city.length - 1) right += 1;
      }
      if (city[left].label == "C") return left;
      else return right;
    }

    this._highLevelMap.forEach((city, cityIndex) => {
      city.forEach((block, blockIndex) => {
        if (
          this._HouseholdMap.get(cityIndex + "-" + blockIndex) &&
          block.label == "H"
        ) {
          let currHousehold = this._HouseholdMap.get(
            cityIndex + "-" + blockIndex
          );
          let nearestClinic = nearestClinicIndex(blockIndex, city);
          currHousehold!.inhabitants.forEach((inhabitant, inhabitantIndex) => {
            if (!inhabitant.isVaccinated) {
              if (inhabitant.age > this._intakeAgeThreshold) {
                currHousehold!.inhabitants[inhabitantIndex].isVaccinated = true;
                let updatedClinic = this._ClinicMap.get(
                  cityIndex + "-" + nearestClinic
                );
                updatedClinic!.enqueue(
                  currHousehold!.inhabitants[inhabitantIndex]
                );
                this._ClinicMap.set(
                  cityIndex + "-" + nearestClinic,
                  updatedClinic!
                );
              }
            }
          });
          let foundUnvaccinatedPerson = currHousehold!.inhabitants.find(
            (person) => person.isVaccinated == false
          );
          if (!foundUnvaccinatedPerson)
            this._highLevelMap[cityIndex][blockIndex].label = "F";
          this._HouseholdMap.set(cityIndex + "-" + blockIndex, currHousehold!);
        }
      });
    });
  }
}

export { HealthMap };