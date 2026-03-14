import { TypeEmp } from 'src/app/enums/TypeEmp';

export interface Emplacement {
  id?: string;
  numero?: string;
  type?: TypeEmp;
  metrage?: number;
  parent?: Emplacement;
  enfants?: Emplacement[];
}
