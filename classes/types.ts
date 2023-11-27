type Person = {
  phn: string;
  fullName: string;
  isVaccinated: boolean;
  age: number;
};

type Household = {
  blockNum: number;
  inhabitants: Person[];
};

type Clinic = {
  name: string;
  staff: number;
  blockNum: number;
};

type City = {
  households: Household[];
  clinics: Clinic[];
};

type Cities = {
  Burnaby: City;
  Vancouver: City;
  Richmond: City;
};

type BlockInfo = {
  label: "H" | "F" | "C" | "x";
};

export { Person, Household, Clinic, City, Cities, BlockInfo };
