import { add } from "date-fns";

export function genExpirationDate(h: number, m: number){ 
  return add(new Date(), { hours: h, minutes: m})
}