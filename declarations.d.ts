// declarations.d.ts

// This tells TypeScript how to handle imports ending with .html, .js, and .ico
declare module '*.html' {
    const content: string;
    export default content;
}

declare module '*.js' {
    const content: string;
    export default content;
}

declare module '*.ico' {
    const content: Buffer;
    export default content;
}