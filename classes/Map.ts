import fs from "fs/promises";
import { City, Cities, BlockInfo } from "./types";
import { DecoratedClinic } from "./Clinic";
import { DecoratedHousehold } from "./Household";

class HealthMap {
  private _cities: Cities;
  private _blocksInLargestCity: number;
  private _intakeAgeThreshold: number;
  private _highLevelMap: BlockInfo[][];
  private _HouseholdMap: Map<number, DecoratedHousehold>[];
  private _ClinicMap: Map<number, DecoratedClinic>[];

  constructor() {
    this._cities = {} as Cities;
    this._blocksInLargestCity = 0;
    this._intakeAgeThreshold = 0;
    this._highLevelMap = [];
    this._HouseholdMap = Array(3);
    this._HouseholdMap[0] = new Map();
    this._HouseholdMap[1] = new Map();
    this._HouseholdMap[2] = new Map();
    this._ClinicMap = Array(3);
    this._ClinicMap[0] = new Map();
    this._ClinicMap[1] = new Map();
    this._ClinicMap[2] = new Map();
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
      this._HouseholdMap[cityIndex].set(
        household.blockNum,
        new DecoratedHousehold(household)
      );
    });
    city.clinics.forEach((clinic) => {
      cityMap[clinic.blockNum] = {
        label: "C",
      };
      this._ClinicMap[cityIndex].set(
        clinic.blockNum,
        new DecoratedClinic(clinic)
      );
    });
    return cityMap;
  }

  public initializeHighLevelMap() {
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
    this.setHouseholdNearestClinic();
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
   * Algorithm to improve on O(n^2) by storing left, right, and nearest in the DecoratedHousehold object.
   */
  public setHouseholdNearestClinic() {
    for (let cityIndex = 0; cityIndex < 3; cityIndex++) {
      this._HouseholdMap[cityIndex].forEach((household, key) => {
        let left = key - 1;
        let right = key + 1;

        let leftLabel = "x";
        let rightLabel = "x";
        if (left >= 0) leftLabel = this._highLevelMap[cityIndex][left].label;
        if (right < this._blocksInLargestCity)
          rightLabel = this._highLevelMap[cityIndex][right].label;
        while (
          leftLabel != "C" &&
          rightLabel != "C" &&
          (left > 0 || right < this._blocksInLargestCity - 1)
        ) {
          let leftHousehold = this._HouseholdMap[cityIndex].get(left);
          if (leftHousehold?.nearestClinicBlockNum) {
            left = leftHousehold?.nearestClinicLeft!;
            right = leftHousehold?.nearestClinicRight!;
          }
          if (left >= 0) leftLabel = this._highLevelMap[cityIndex][left].label;
          if (right < this._blocksInLargestCity)
            rightLabel = this._highLevelMap[cityIndex][right].label;
          if (leftLabel != "C" && left > 0) {
            left -= 1;
          }
          if (rightLabel != "C" && right < this._blocksInLargestCity - 1) {
            right += 1;
          }
        }
        household.nearestClinicLeft = left;
        household.nearestClinicRight = right;
        if (left < 0) household.nearestClinicBlockNum = right;
        else if (right > this._blocksInLargestCity - 1)
          household.nearestClinicBlockNum = left;
        else if (key - left < right - key) {
          if (leftLabel == "C") household.nearestClinicBlockNum = left;
          else household.nearestClinicBlockNum = right;
        } else {
          if (rightLabel == "C") household.nearestClinicBlockNum = right;
          else household.nearestClinicBlockNum = left;
        }
        this._HouseholdMap[cityIndex].set(key, household);
      });
    }
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
          this._HouseholdMap[cityIndex].get(blockIndex) &&
          block.label == "H"
        ) {
          let currHousehold = this._HouseholdMap[cityIndex].get(blockIndex);
          let nearestClinic = currHousehold?.nearestClinicBlockNum!;
          currHousehold!.inhabitants.forEach((inhabitant, inhabitantIndex) => {
            if (!inhabitant.isVaccinated) {
              if (inhabitant.age > this._intakeAgeThreshold) {
                currHousehold!.inhabitants[inhabitantIndex].isVaccinated = true;
                let updatedClinic =
                  this._ClinicMap[cityIndex].get(nearestClinic);
                updatedClinic!.enqueue(
                  currHousehold!.inhabitants[inhabitantIndex]
                );
                this._ClinicMap[cityIndex].set(nearestClinic, updatedClinic!);
              }
            }
          });
          let foundUnvaccinatedPerson = currHousehold!.inhabitants.find(
            (person) => person.isVaccinated == false
          );
          if (!foundUnvaccinatedPerson)
            this._highLevelMap[cityIndex][blockIndex].label = "F";
          this._HouseholdMap[cityIndex].set(blockIndex, currHousehold!);
        }
      });
    });
  }
}

export { HealthMap };
