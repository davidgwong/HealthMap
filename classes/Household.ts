import { Household, Person } from "./types";

class DecoratedHousehold {
  public blockNum: number;
  public inhabitants: Person[];
  public nearestClinicBlockNum: number | null;

  constructor(household: Household) {
    this.blockNum = household.blockNum;
    this.inhabitants = household.inhabitants;
    this.nearestClinicBlockNum = null;
  }
}

export { DecoratedHousehold };
