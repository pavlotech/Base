import Event from "@core/classes/event.class";
import Module, { ModuleType } from "@core/classes/module.class";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
/*     
    // 1. Создаем событие, которое просто принимает строку и выводит её в лог
    const delayedLog = new Event<string>((text) => {
        console.log(`[ЛОГ]: ${text}`);
    });

    console.log("Модуль запущен. Ждем 3 секунды...");

    // 2. Вызываем таймер на 3000 миллисекунд (3 секунды)
    await delayedLog.timer(3000, "Привет! Я лог, который вызвался через время.");

    console.log("Код идет дальше после срабатывания таймера.");
     */
});