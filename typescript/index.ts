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

type Test3 = RequiredObj<Obj>;
//    ^?
