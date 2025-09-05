import { get, writable } from "svelte/store";

type UserPreference = {
    theme?: "blue" | "red" | "green" | "yellow" | "orange";
    appearance?: "light" | "dark" | "auto" | "pureDark";
    fontFamily?: "Puvi" | "Roboto" | "Lato";
};

// sets the user preference to the widget
function setUserPref(userPref: UserPreference) {
    const root = document.documentElement;

    if (userPref.theme) {
        const themeClass = Array.from(root.classList).find((c) => c.startsWith("theme-"));
        if (themeClass) root.classList.remove(themeClass);

        root.classList.add(`theme-${userPref.theme.toLowerCase()}`);
    }
    if (userPref.appearance) {
        const appearanceClass = Array.from(root.classList).find((c) => c.startsWith("appearance-"));
        if (appearanceClass) root.classList.remove(appearanceClass);

        let appearance = userPref.appearance.toLowerCase();

        // Pure dark case
        if (appearance === "puredark") {
            appearance = "dark";
            root.classList.add("pure-dark");
        } else {
            root.classList.remove("pure-dark");
        }

        // Appearance Auto case
        if (appearance === "auto") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                appearance = "dark";
            } else {
                appearance = "light";
            }
        }

        root.classList.add(`appearance-${appearance}`);
    }
    if (userPref.fontFamily) {
        const fontFamilyClass = Array.from(root.classList).find((c) => c.startsWith("font-"));
        if (fontFamilyClass) root.classList.remove(fontFamilyClass);

        root.classList.add(`font-${userPref.fontFamily.toLowerCase()}`);
    }
}

// initialize the app
export let APP = writable<APP | null>(null);

let appPromise: Promise<APP> | null = null;

export async function initApp(): Promise<APP> {
    if (APP) {
        const appValue = get(APP);
        if (appValue) return Promise.resolve(appValue);
    }

    if (!appPromise) {
        appPromise = new Promise<APP>((resolve) => {
            ZOHODESK.extension.onload().then((app) => {
                setUserPref(app.meta.userPreferences);
                app.instance.on("user_preference.changed", setUserPref);
                APP.set(app);
                resolve(app);
            });
        });
    }

    return appPromise;
}

// validate the key for db storage
function validateKey(key: string) {
    return /^[a-zA-Z0-9_,:]{1,50}$/g.test(key);
}

// utility class for extension db operations
export class DB {
    static async set({ key, value, queriableValue = "" }: { key?: string; value: any; queriableValue?: string }) {
        if ((key && !validateKey(key)) || (queriableValue && !validateKey(queriableValue))) {
            throw new Error("Invalid key or queriableValue");
        }

        return await ZOHODESK.set("database", { key, value, queriableValue });
    }

    static async get({
        key,
        queriableValue,
        from,
        limit,
    }: {
        key?: string;
        queriableValue?: string;
        from?: number;
        limit?: number;
    }) {
        if ((key && !validateKey(key)) || (queriableValue && !validateKey(queriableValue))) {
            throw new Error("Invalid key or queriableValue");
        }

        const payload: any = { key, queriableValue, from, limit };
        if (!queriableValue) delete payload.queriableValue;
        if (!from) delete payload.from;
        if (!limit) delete payload.limit;
        if (!key) delete payload.key;

        if (Object.keys(payload).length === 0) {
            throw new Error("At least one of key or queriableValue is required");
        }

        return await ZOHODESK.get("database", payload);
    }

    static async delete({ key, queriableValue }: { key?: string; queriableValue?: string }) {
        if ((key && !validateKey(key)) || (queriableValue && !validateKey(queriableValue))) {
            throw new Error("Invalid key or queriableValue");
        }

        const payload: any = { key, queriableValue };
        if (!key) delete payload.key;
        if (!queriableValue) delete payload.queriableValue;

        if (Object.keys(payload).length === 0) {
            throw new Error("At least one of key or queriableValue is required");
        }

        return await ZOHODESK.delete("database", payload);
    }
}

// Translation Utility
export async function getThread(ticketId: string, threadId: string) {
    const res = await ZOHODESK.request({
        url: `https://desk.zoho.com/api/v1/tickets/${ticketId}/threads/${threadId}?include=plainText`,
        method: "GET",
        headers: {},
        connectionLinkName: "desk",
        responseType: "json",
        data: {},
    });

    return res;
}

export let languageCodes = [
    { label: "English", value: "en" },
    { label: "Kannada", value: "kn" },
    { label: "Tamil", value: "ta" },
    { label: "Telugu", value: "te" },
    { label: "Marathi", value: "mr" },
    { label: "Arabic", value: "ar" },
    { label: "Bengali", value: "bn" },
    { label: "German", value: "de" },
    { label: "French", value: "fr" },
    { label: "Hindi", value: "hi" },
    { label: "Italian", value: "it" },
    { label: "Korean", value: "ko" },
    { label: "Dutch", value: "nl" },
    { label: "Polish", value: "pl" },
    { label: "Portuguese", value: "pt" },
    { label: "Russian", value: "ru" },
    { label: "Thai", value: "th" },
    { label: "Turkish", value: "tr" },
    { label: "Vietnamese", value: "vi" },
    { label: "Chinese (Simplified)", value: "zh" },
    { label: "Chinese (Traditional)", value: "zh-Hant" },
    { label: "Bulgarian", value: "bg" },
    { label: "Czech", value: "cs" },
    { label: "Danish", value: "da" },
    { label: "Greek", value: "el" },
    { label: "Finnish", value: "fi" },
    { label: "Croatian", value: "hr" },
    { label: "Hungarian", value: "hu" },
    { label: "Indonesian", value: "id" },
    { label: "Hebrew", value: "iw" },
    { label: "Norwegian", value: "no" },
    { label: "Romanian", value: "ro" },
    { label: "Slovak", value: "sk" },
    { label: "Slovenian", value: "sl" },
    { label: "Swedish", value: "sv" },
    { label: "Ukrainian", value: "uk" },
];

export async function detectLanguage(text: string) {
    if ("LanguageDetector" in self) {
        console.log("Language detector supported");
    } else {
        console.log("Language detector not supported");
        return;
    }

    // @ts-ignore
    const availability = await self.LanguageDetector.availability();
    let detector;

    function monitor(m: any) {
        m.addEventListener("downloadprogress", (e: any) => {
            console.log(`Downloading Language Detector Model ${Math.round((e.loaded / e.total) * 100)}%`);
        });
    }

    console.log({ availability });

    if (availability === "unavailable") {
        // Model is not available
        console.log("Language detect or is not available in your browser");
        return;
    }

    if (availability === "available") {
        // Model is available for use
        // @ts-ignore
        detector = await self.LanguageDetector.create();
        // @ts-ignore
        const result = await detector.detect(text);

        if (result.length === 0) {
            console.error(`language can't be detected`);
            return;
        }

        return result[0];
    } else {
        // Model is available for download
        // @ts-ignore
        detector = await self.LanguageDetector.create({
            monitor,
        });

        await detector.ready;

        const result = await detector.detect(text);

        if (result.length === 0) {
            console.error(`language can't be detected`);
            return;
        }

        return result[0];
    }
}

export async function translate(sourceLanguage: string, targetLanguage: string, textToTranslate: string) {
    if (!("Translator" in self)) {
        console.log({ sourceLanguage, targetLanguage });
        console.error("Translator not supported!!!");
        return;
    }

    console.log({ sourceLanguage, targetLanguage, textToTranslate });

    // @ts-ignore
    const translatorCapabilities = await self.Translator.availability({
        sourceLanguage,
        targetLanguage,
    });

    function monitor(m: any) {
        m.addEventListener("downloadprogress", (e: any) => {
         
            console.log(`Downloading Translator Model for ${sourceLanguage} to ${targetLanguage} pair ${Math.round(
                (e.loaded / e.total) * 100
            )}%`);
        });
    }

    if (translatorCapabilities === "unavailable") {
        console.log("Translator is not available in your browser");
        return;
    }

    let translatedText = "";

    if (translatorCapabilities === "available") {
        // @ts-ignore
        const translator = await self.Translator.create({
            sourceLanguage,
            targetLanguage,
        });

        try {
            const stream = await translator.translateStreaming(textToTranslate);
            for await (const chunk of stream) {
                translatedText += chunk;
            }
        } catch (error) {
            console.log(error);
        }
        return translatedText;
    } else {
        // @ts-ignore
        const translator = await self.Translator.create({
            sourceLanguage,
            targetLanguage,
            monitor,
        });

        await translator.ready;
        try {
            const stream = await translator.translateStreaming(textToTranslate);
            for await (const chunk of stream) {
                translatedText += chunk;
            }
        } catch (error) {
            console.log(error);
        }
        return translatedText;
    }
}
