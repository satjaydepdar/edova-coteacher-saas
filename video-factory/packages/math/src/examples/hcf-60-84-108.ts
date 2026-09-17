import { buildHcfMaxSeating } from "../builders/hcf-max-seating";
export const hcfExample = buildHcfMaxSeating({
  question: "In each room the same number of participants are to be seated and all of them being in the same subject, hence maximum participants that can be accommodated in each room are: a)14 b)12 c)16 d)18",
  groups: [{ label: "Hindi", n: 60 }, { label: "English", n: 84 }, { label: "Maths", n: 108 }],
  answerOption: "b",
});
