declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
    multiline?: boolean;
    override?: boolean;
  }

  export interface DotenvConfigOutput {
    parsed?: { [name: string]: string };
    error?: Error;
  }

  export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
  export function parse(src: string | Buffer): { [name: string]: string };
}