export * from './lib';
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require.resolve("react");
    Object.assign(exports, require("./react/index"));
} catch {
    // React not installed – ignore
}