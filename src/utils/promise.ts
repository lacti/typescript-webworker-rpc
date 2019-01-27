type PromiseResolver<T> = (value?: T) => void;

export class ValueResolver<T> {
  public static create<T>() {
    return new ValueResolver<T>();
  }

  private resolver: PromiseResolver<T> | null = null;
  private rejecter: ((reason?: any) => void) | null = null;

  public set = (
    resolver: PromiseResolver<T>,
    reject: ((reason?: any) => void) | null = null,
  ) => {
    if (this.resolver) {
      const error = new Error('Resolver already exists');
      if (reject) {
        return reject(error);
      } else {
        throw error;
      }
    }
    this.resolver = resolver;
    this.rejecter = reject;
  };

  public promise = (work?: () => void) =>
    new Promise<T>((resolve, reject) => {
      this.set(resolve, reject);
      if (work) {
        try {
          work();
        } catch (error) {
          this.reject(error);
        }
      }
    });

  public resolve = (value?: T) => {
    if (!this.resolver) {
      const error = new Error('No Resolver');
      if (this.rejecter) {
        return this.rejecter(error);
      } else {
        throw error;
      }
    }
    this.resolver(value);
    this.resolver = null;
    this.rejecter = null;
  };

  public reject = (reason?: any) => {
    if (this.rejecter) {
      this.rejecter(reason);
    } else {
      throw reason;
    }
    this.resolver = null;
    this.rejecter = null;
  };
}
