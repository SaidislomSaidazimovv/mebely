// РЕЕСТР КАССЕТ КУЗНИЦЫ — одна строка на кассету (закон Capacitor, без глобов).
import type { Cartridge } from "../../dogovor/cartridge.interface";
import { cartridge as Vyrez } from "./vyrez/src";
import { cartridge as Skruglenie } from "./skruglenie/src";
import { cartridge as Faska } from "./faska/src";
import { cartridge as Paz } from "./paz/src";
import { cartridge as Povorot } from "./povorot/src";
import { cartridge as Skleyka } from "./skleyka/src";
import { cartridge as Vyemka } from "./vyemka/src";

export const CARTRIDGES: Cartridge[] = [Vyrez, Skruglenie, Faska, Paz, Povorot, Skleyka, Vyemka];
