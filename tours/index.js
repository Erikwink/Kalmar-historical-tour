import kalmarMedeltiden from "./kalmar-medeltiden";
import kalmar from "./kalmar.js";
import imgKyrka  from "./img/kalmar-kyrka.png";
import imgSlott  from "./img/kalmar-slott.png";
import imgSund   from "./img/kalmar-sund.png";
import imgUnion  from "./img/kalmar-union.png";

const placeholderTours = [
  { id: "kalmar-union",    title: "Kalmarunionen",       icon: "account_balance", image: imgUnion, durationMinutes: 90,  scenes: [] },
  { id: "kalmar-slott",    title: "Kalmar slott",         icon: "castle",          image: imgSlott, durationMinutes: 60,  scenes: [] },
  { id: "kalmar-hamn",     title: "Kalmar hamn",          icon: "anchor",          image: imgSund,  durationMinutes: 45,  scenes: [] },
  { id: "kalmarsund",      title: "Kalmarsund",           icon: "sailing",         image: imgSund,  durationMinutes: 75,  scenes: [] },
  { id: "kalmar-domkyrka", title: "Kalmar domkyrka",      icon: "church",          image: imgKyrka, durationMinutes: 50,  scenes: [] },
  { id: "kalmar-1600",     title: "Kalmar på 1600-talet", icon: "history_edu",     image: imgSlott, durationMinutes: 100, scenes: [] },
  { id: "skelleftea",      title: "Skellefteå Historia",  icon: "castle",          image: imgUnion, durationMinutes: 60,  scenes: [] },
  { id: "kalmar-test",     title: "Kalmar Test",          icon: "castle",          image: imgKyrka, durationMinutes: 60,  scenes: [] },
  
];

export const tours = [
  kalmarMedeltiden,
  kalmar,
];

export { WAITING_CONTROLS } from "./waiting-controls";
