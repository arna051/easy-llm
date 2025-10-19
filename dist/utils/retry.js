"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosWithRetry = axiosWithRetry;
async function axiosWithRetry(axios, body, controller, retries = 3, retryDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await axios.post('', body, { signal: controller.signal });
            return response;
        }
        catch (error) {
            lastError = error;
            if (attempt < retries) {
                console.warn(`Request failed (attempt ${attempt + 1} of ${retries}). Retrying in ${retryDelay}ms...`);
                await new Promise((res) => setTimeout(res, retryDelay));
            }
        }
    }
    throw lastError;
}
