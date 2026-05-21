declare module "node:sqlite" {
  export class StatementSync {
    all(...args: any[]): any[];
    get(...args: any[]): any;
    run(...args: any[]): any;
    iterate(...args: any[]): IterableIterator<any>;
    columns(...args: any[]): any[];
    setAllowBareNamedParameters(value: boolean): void;
    setAllowUnknownNamedParameters(value: boolean): void;
    setReadBigInts(value: boolean): void;
    setReturnArrays(value: boolean): void;
  }

  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    open(): void;
    close(): void;
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    function(...args: any[]): any;
    createTagStore(...args: any[]): any;
    location(): string;
    aggregate(...args: any[]): any;
    createSession(...args: any[]): any;
    applyChangeset(...args: any[]): any;
    enableLoadExtension(...args: any[]): any;
    loadExtension(...args: any[]): any;
    setAuthorizer(...args: any[]): any;
  }

  export const constants: Record<string, unknown>;
  export const backup: (...args: any[]) => any;
}
