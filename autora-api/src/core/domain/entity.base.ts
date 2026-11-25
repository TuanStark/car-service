export abstract class BaseEntity<TProps> {
  protected readonly props: TProps;
  public readonly id: string;

  protected constructor(id: string, props: TProps) {
    this.id = id;
    this.props = props;
  }

  public equals(other?: BaseEntity<TProps>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
