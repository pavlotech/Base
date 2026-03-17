import path from "path";
import fs from "fs";
/* import { translate } from "bing-translate-api"; */
import { ILocale, LocaleData } from "@core/interfaces/locale.interface";

export default class Locale implements ILocale {
    private cache: Map<string, LocaleData> = new Map();
    private localeDir: string = path.join(process.cwd(), 'config', 'languages');

    constructor(localeDir?: string) {
        if (localeDir) {
            this.localeDir = localeDir;
        }
    }

    public async get(lang: string): Promise<LocaleData> {
        return this.cache.get(lang) ?? (await this.loadLocale(lang));
    }

/*     public async translate(text: string, lang: string) {
        try {
            const translation = await translate(text, null, lang);
            return translation?.translation || text;
        } catch (error) {
            throw new Error(`Translate error: ${error}`);
        }
    } */

    private async loadLocale(lang: string): Promise<LocaleData> {
        const files = await fs.promises.readdir(this.localeDir);
        const supportedLanguages = files
            .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
            .map((file) => file.split(".")[0]);

        lang = supportedLanguages.includes(lang) ? lang : "ru";

        // Prefer .ts over .js
        const fileName =
            files.find((file) => file === `${lang}.ts`) ||
            files.find((file) => file === `${lang}.js`);

        if (!fileName) {
            throw new Error(`Locale file for ${lang} not found`);
        }

        const modulePath = path.join(this.localeDir, fileName);
        const { default: localeData } = (await import(modulePath)) as {
            default: LocaleData;
        };
        this.cache.set(lang, localeData);
        return localeData;
    }
}
