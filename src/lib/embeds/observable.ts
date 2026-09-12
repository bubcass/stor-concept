const OBSERVABLE_HOST = "https://observablehq.com";
const OBSERVABLE_API_HOST = "https://api.observablehq.com";

export const OBSERVABLE_INSPECTOR_CSS_URL =
    "https://cdn.jsdelivr.net/npm/@observablehq/inspector@5/dist/inspector.css";
export const OBSERVABLE_RUNTIME_MODULE_URL =
    "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";

function stripTags(value: string) {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeNotebookPath(value: string) {
    return value.replace(/^\/+/, "").replace(/\.js$/i, "");
}

function notebookPathFromObservableUrl(value: string) {
    try {
        const url = new URL(value);
        if (!/observablehq\.com$/i.test(url.hostname)) return "";
        return normalizeNotebookPath(url.pathname);
    } catch {
        return "";
    }
}

function notebookPathFromApiUrl(value: string) {
    try {
        const url = new URL(value);
        if (!/^api\.observablehq\.com$/i.test(url.hostname)) return "";
        return normalizeNotebookPath(url.pathname);
    } catch {
        return "";
    }
}

function observableNotebookUrlFromPath(path: string) {
    const normalized = normalizeNotebookPath(path);
    return normalized ? `${OBSERVABLE_HOST}/${normalized}` : "";
}

export function deriveObservableNotebookUrl(moduleUrl: string) {
    const notebookPath = notebookPathFromApiUrl(moduleUrl);
    return notebookPath ? observableNotebookUrlFromPath(notebookPath) : "";
}

function deriveObservableModuleUrlFromNotebookPath(path: string) {
    const normalized = normalizeNotebookPath(path);
    return normalized ? `${OBSERVABLE_API_HOST}/${normalized}.js?v=4` : "";
}

function sourceSummary(moduleUrl: string, cellName: string) {
    const notebookPath =
        notebookPathFromApiUrl(moduleUrl) || notebookPathFromObservableUrl(moduleUrl);
    if (!notebookPath) return moduleUrl;
    return cellName ? `${notebookPath}#${cellName}` : notebookPath;
}

export function formatObservableSource(moduleUrl: string, cellName: string) {
    if (!moduleUrl) return "";
    return sourceSummary(moduleUrl, cellName.trim());
}

export type ObservableEmbedSource = {
    moduleUrl: string;
    cellName: string;
    notebookUrl: string;
    creditHref: string;
    creditText: string;
    normalizedSource: string;
};

export function parseObservableSource(value: string): ObservableEmbedSource {
    const trimmed = value.trim();
    if (!trimmed) {
        return {
            moduleUrl: "",
            cellName: "",
            notebookUrl: "",
            creditHref: "",
            creditText: "",
            normalizedSource: "",
        };
    }

    const creditHref =
        trimmed.match(/<a[^>]+href=['"]([^'"]+)['"]/i)?.[1]?.trim() || "";
    const creditTextMatch = trimmed.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    const creditText = stripTags(creditTextMatch?.[1] ?? "");

    const moduleUrlFromSnippet =
        trimmed.match(/import\s+define\s+from\s+['"]([^'"]+)['"]/i)?.[1]?.trim() ||
        "";
    const notebookUrlFromSnippet =
        trimmed.match(/(https?:\/\/observablehq\.com\/[^\s"'<>#]+(?:#[^\s"'<>]+)?)/i)?.[1]?.trim() ||
        "";
    const directObservableUrl =
        trimmed.match(/^(https?:\/\/(?:api\.)?observablehq\.com\/[^\s"'<>#]+(?:#[^\s"'<>]+)?)$/i)?.[1]?.trim() ||
        "";
    const shorthandSource =
        trimmed.match(/^((?:@|d\/)[^\s"'<>#]+(?:#[A-Za-z_$][\w$]*)?)$/i)?.[1]?.trim() ||
        "";
    const inlineCellName =
        trimmed.match(
            /^(?:https?:\/\/(?:api\.)?observablehq\.com\/[^\s"'<>#]+|(?:@|d\/)[^\s"'<>#]+)#([A-Za-z_$][\w$]*)$/i,
        )?.[1]?.trim() || "";

    const idCellMatch = trimmed.match(/id=(['"])observablehq-([A-Za-z_$][\w$]*)-[^'"]+\1/i);
    const nameCellMatch = trimmed.match(/name\s*===\s*(['"])([A-Za-z_$][\w$]*)\1/i);

    const moduleUrl =
        moduleUrlFromSnippet ||
        (directObservableUrl.startsWith(OBSERVABLE_API_HOST)
            ? directObservableUrl
            : directObservableUrl
                ? deriveObservableModuleUrlFromNotebookPath(
                    notebookPathFromObservableUrl(directObservableUrl),
                )
                : shorthandSource
                    ? deriveObservableModuleUrlFromNotebookPath(
                        shorthandSource.split("#")[0],
                    )
                    : notebookUrlFromSnippet
                        ? deriveObservableModuleUrlFromNotebookPath(
                            notebookPathFromObservableUrl(notebookUrlFromSnippet),
                        )
                        : "");

    const cellName =
        nameCellMatch?.[2]?.trim() ||
        idCellMatch?.[2]?.trim() ||
        inlineCellName ||
        notebookUrlFromSnippet.split("#")[1]?.trim() ||
        shorthandSource.split("#")[1]?.trim() ||
        "";

    const notebookUrl =
        (creditHref && /^https?:\/\/observablehq\.com\//i.test(creditHref)
            ? creditHref
            : "") ||
        (directObservableUrl.startsWith(OBSERVABLE_HOST) ? directObservableUrl.split("#")[0] : "") ||
        (notebookUrlFromSnippet ? notebookUrlFromSnippet.split("#")[0] : "") ||
        deriveObservableNotebookUrl(moduleUrl);

    return {
        moduleUrl,
        cellName,
        notebookUrl,
        creditHref,
        creditText,
        normalizedSource: sourceSummary(moduleUrl, cellName),
    };
}
