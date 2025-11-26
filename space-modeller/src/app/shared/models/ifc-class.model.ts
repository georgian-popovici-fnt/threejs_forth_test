/**
 * Represents an IFC class/category with its visibility state
 */
export interface IfcClass {
  name: string;
  visible: boolean;
  itemIds: number[];
}
