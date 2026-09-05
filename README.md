# mebelchi-next · ГОРОД + КАССЕТЫ

```
dogovor/       розетка: интерфейс + схема + СТЕНД + проверка   · Основатель, только PR
dvizhok/       движок: декомпозиция, кромка, SWJ008/DXF        · Основатель
prilozhenie/   korpus + cartridges (экраны 01–07, хаб)         · Саид
kuznitsa/      verstak + cartridges (вырез … поворот)          · Саидислом
biblioteka/    komponenty · bloki                              · новое
dannye/        каталоги · прайсы                               · данные, не код
panel/         scan.mjs + dashboard.html                       · обновляется сам
```

## Данные — тоже файлы (см. `../UROVNI.html`)

- Настройки: `dogovor/nastroyki/obshie.json` (общие) · `tumblery.json` (включатели) · `*/nastroyki.json` (по домам)
- Комплекты (бандлы): `dogovor/komplekty/*.json` — один файл = один комплект · `_yadro.json` = запечатано, CE не трогать (DB/44 §2)
- Правила роста: `dogovor/predlozheniya/PR-N_*.json` — триггер → предложение · `_etika.json` = запечатано · `_slovar.json` = события, которые приложения обязаны эмитить
- Комплекты и правила роста правит **Пульт**, не разработчик. `status: aktivno` руками — нельзя.
- Таблицы: `dannye/**/*.csv` — канон, правится Excel-ем, диффается в git · XLSX завода → `dannye/vhodyashie/`
- Сторожа: `_shema.json` / `_pravila.json` рядом с каждым файлом — чужой ключ/колонка = 🔴, мерж закрыт

## Четыре команды

- `npm run scan` — пересчитать панель по реальным папкам
- `npm run pult` — собрать инвентарь Пульта · `node pult/server.mjs` → http://localhost:4571
- `npm run kontrol` — проверить все настройки, таблицы, комплекты и правила роста (ядро + этика + ссылки)
- `npm run proverka kuznitsa/cartridges/vyrez` — гейт приёмки кассеты
- открыть `panel/dashboard.html` — смотреть

## Три закона (DB/36)

- Читай свободно · **Не пиши никогда** · Всегда emit
- Кассета импортирует только `dogovor` — проверка ловит побег
- Зелёный = manifest + src + test + строка в реестре + api совпал

## Облако

- Имена латиницей, без пробелов · `.gitattributes` LF · `.devcontainer` для Codespaces
- Передача кассеты = ветка + PR только внутри её папки · CODEOWNERS сторожит территории
