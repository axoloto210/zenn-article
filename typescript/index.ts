type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredObj<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
};

type Obj = {
  requiredString: string;
  requiredObject: {
    required: string;
    optional?: string;
  };

  optionalString?: string;
  optionalObject?: {
    required: string;
    optional?: string;
  };

  requiredUndefinedOrNumber: number | undefined;
  optionalUndefinedOrNumber?: number | undefined;
};

type Test = RequiredKeys<Obj>;

type Test2 = OptionalKeys<Obj>;

type MappedObj = RequiredObj<Obj>;
// type MappedObj = {
//     requiredString: "requiredString";
//     requiredObject: "requiredObject";
//     optionalString: never;
//     optionalObject: never;
//     requiredUndefinedOrNumber: "requiredUndefinedOrNumber";
//     optionalUndefinedOrNumber: never;
// }

type PickedBaseObj = {
  pickedString: string;
  pickedNumber: number;
  other: string;
};

type PickedObj = Pick<PickedBaseObj, "pickedString" | "pickedNumber">;
//    ^?type PickedObj = {
//     pickedString: string;
//     pickedNumber: number;
// }

type IndexedAccessBaseObj = {
  indexedString: string;
  indexedNumber: number;
  other: number;
};

type IndexedAccessObj = IndexedAccessBaseObj["indexedString" | "indexedNumber"];
//   ^? type IndexedAccessObj = string | number

type Conditional<T> = T extends string ? number : boolean;

type ConditionalString = Conditional<string>;
//   ^? type ConditionalString = number
type ConditionalNumber = Conditional<number>;
//   ^? type ConditionalNumber = boolean

type MappedBaseType = {
  foo?: string;
  bar?: number;
};

type RequiredMappedType = {
  [K in keyof MappedBaseType]-?: MappedBaseType[K];
};
// type RequiredMappedType = {
//   foo: string;
//   bar: number;
// }

type EmptyConditional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false
type EmptyTest = EmptyConditional<Obj, "requiredString"> 