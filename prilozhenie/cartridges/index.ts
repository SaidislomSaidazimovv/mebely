// РЕЕСТР ЭКРАНОВ ПРИЛОЖЕНИЯ — одна видимая строка на экран. Порядок = FLOW маршрута.
import { Pomeshenie } from "./pomeshenie/src";   // 01
import { Varianty } from "./varianty/src";       // 02
import { Konstruktor } from "./konstruktor/src"; // 03
import { Render } from "./render/src";           // 04
import { Inzheneria } from "./inzheneria/src";   // 05
import { Smeta } from "./smeta/src";             // 06
import { Peredacha } from "./peredacha/src";     // 07
import { Hub } from "./hub/src";                 // hub

export const SCREENS = [Pomeshenie, Varianty, Konstruktor, Render, Inzheneria, Smeta, Peredacha, Hub];
