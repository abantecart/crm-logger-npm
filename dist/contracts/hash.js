"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = sha256Hex;
exports.safeHash = safeHash;
const node_crypto_1 = require("node:crypto");
function sha256Hex(value) {
    return (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
}
function safeHash(value, salt) {
    if (!value)
        return undefined;
    return sha256Hex(`${salt}:${value}`);
}
//# sourceMappingURL=hash.js.map