interface Path {
  prev: any;
  [key: string]: any;
}

const flatten = (path: Path): any[] => {
  return Object.keys(path).reduce((prev: any[], element: any) => {
    const next: any = path[element];
    if (typeof next === 'object' && !Array.isArray(next)) {
      return [...prev, ...flatten(next as Path)];
    }
    return typeof next !== 'undefined' ? [...prev, next] : prev;
  }, []);
};

export default function(path: Path, operation: any): any[] {
  if (typeof operation !== 'undefined' && operation.operation) {
    return [operation.operation.toString(), ...flatten(path)];
  }
  return flatten(path);
}
