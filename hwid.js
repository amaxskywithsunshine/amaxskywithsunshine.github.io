/**
 * Hardware Identification & Machine Security Module
 * Inspects host machine hardware attributes to generate a unique Hardware ID (HWID).
 */
const os = require("os");
const crypto = require("crypto");
const { execSync } = require("child_process");
const fs = require("fs");

function getMachineGuid() {
  if (process.platform === "win32") {
    try {
      const out = execSync("reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const match = out.match(/REG_SZ\s+([^\r\n]+)/);
      if (match) return match[1].trim();
    } catch (e) {
      // Fallback if reg query fails
    }
  } else {
    // Linux / Unix fallback
    try {
      if (fs.existsSync("/etc/machine-id")) {
        return fs.readFileSync("/etc/machine-id", "utf8").trim();
      }
      if (fs.existsSync("/var/lib/dbus/machine-id")) {
        return fs.readFileSync("/var/lib/dbus/machine-id", "utf8").trim();
      }
    } catch (e) {}
  }
  return "UNKNOWN_GUID";
}

function getPrimaryMac() {
  try {
    const interfaces = os.networkInterfaces();
    const macs = Object.values(interfaces)
      .flat()
      .map((i) => i?.mac)
      .filter((m) => m && m !== "00:00:00:00:00:00" && !m.startsWith("00:00"))
      .sort();
    return macs[0] || "00:00:00:00:00:00";
  } catch (e) {
    return "00:00:00:00:00:00";
  }
}

function getSystemHWID() {
  const machineGuid = getMachineGuid();
  const hostname = os.hostname() || "localhost";
  const cpuModel = os.cpus()?.[0]?.model || "Unknown-CPU";
  const primaryMac = getPrimaryMac();

  const raw = `${machineGuid}::${hostname}::${primaryMac}::${cpuModel}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
  const prefix = process.platform === "win32" ? "HWID-WIN" : "HWID-UNIX";
  const formatted = `${prefix}-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;

  return {
    hwid: formatted,
    rawGuid: machineGuid,
    hostname,
    primaryMac,
    cpuModel,
    platform: process.platform,
    arch: process.arch,
  };
}

function verifyHWID(allowedHwid) {
  const current = getSystemHWID();
  if (!allowedHwid || allowedHwid.trim() === "") {
    return {
      allowed: false,
      reason: "NO_HWID_CONFIGURED",
      currentHwid: current.hwid,
      systemInfo: current,
    };
  }

  const isMatch = current.hwid.toUpperCase() === allowedHwid.trim().toUpperCase();
  return {
    allowed: isMatch,
    reason: isMatch ? "MATCH" : "MISMATCH",
    currentHwid: current.hwid,
    allowedHwid: allowedHwid.trim(),
    systemInfo: current,
  };
}

module.exports = {
  getSystemHWID,
  verifyHWID,
};
