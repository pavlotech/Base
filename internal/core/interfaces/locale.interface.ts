export interface LocaleData {

}

export interface ILocale {
    get(lang: string): Promise<LocaleData>;
/*     translate(text: string, lang: string): Promise<string>; */
}
