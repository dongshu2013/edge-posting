import dayjs from "dayjs";
import { parseGwei } from "viem";
import Decimal from "decimal.js";

type numType = number | string;

export function multiplieNumber(
  num1?: numType,
  num2?: numType,
  digit?: number
) {
  if (!num1 || !num2) return "";
  const _num1 = new Decimal(num1);
  const _num2 = new Decimal(num2);
  return _num1.times(_num2).toFixed(digit);
}

// 两数相除
export function divideNumber(num1: numType, num2: numType, digit?: number) {
  if (!num1 || !num2) return "";
  const _num1 = new Decimal(num1);
  const _num2 = new Decimal(num2);
  return _num1.dividedBy(_num2).toFixed(digit);
}

// 脱敏字符串
export function decimalStr(str?: string | number, start = 6, end = -4) {
  if (!str) return "";
  if (typeof str === "number") str = str.toString();
  return str.slice(0, start) + "..." + str.slice(end);
}

// 移除单位
export function removeUnit(value?: string | number) {
  if (!value) return "";
  const str = value.toString();
  const numStr = str.replace(/[^\d.]/g, "");
  return isNaN(Number(numStr)) ? "" : Number(numStr).toString();
}

// 计算gas
export const calculateGasFromGwei = (val: string, clain: number) => {
  if (!val) return "";
  if (clain === 101 || clain === 728126428) return removeUnit(val);
  try {
    const gweiVal = val.replace("Gwei", "").split("+");
    const totalGwei = gweiVal.reduce((sum, val) => sum + parseFloat(val), 0);
    return String(parseGwei(`${totalGwei}`));
  } catch (e) {
    return "0n";
  }
};

export function getChainType(chainId: number) {
  if (chainId === 1 || chainId === 56 || chainId === 8453) {
    return "EVM";
  } else if (chainId === 101) {
    return "SOLANA";
  } else if (chainId === 728126428) {
    return "TRON";
  }
  return "EVM";
}

// 时间格式化
export function formatTime(time: string, format = "YYYY-MM-DD HH:mm:ss") {
  if (!time) return "";
  return dayjs(time).format(format);
}

// 截取字符串
export function sliceStr(str?: string | number, digit = 4) {
  if (!str) return "";
  if (typeof str === "number") str = str.toString();
  const splitArr = str.split(".");
  if (!splitArr[1]) return str;
  const _str = splitArr[1].substring(0, digit);
  const lastStr = _str.replace(/\.?0+$/, "");
  const _lastStr = lastStr ? "." + lastStr : "";
  return splitArr[0] + _lastStr;
}

// 带零小数位处理
export function decimalFloat(num?: number | string, digit = 4, decimal = 4) {
  if (!num) return "";
  const _num = new Decimal(num);
  const str = _num.toFixed();
  // 找小数点后的连续 0
  const match = str.match(/^0\.0+(.*)$/);
  if (!match) {
    return sliceStr(str, decimal);
  }
  // 0 的个数
  const zeros = str.split(".")[1].match(/^0+/);
  if (!zeros || zeros[0].length < 4) return sliceStr(str, decimal);
  const charCode =
    zeros[0].length > 9
      ? `${String.fromCharCode(0x2081)}${String.fromCharCode(
          0x2080 + (zeros[0].length - 10)
        )}`
      : String.fromCharCode(0x2080 + zeros[0].length);
  return `0.0${charCode}${match[1].slice(0, digit)}`;
}

// 格式化数字，带单位
export function formatNumberWithUnit(value: number | string, digit?: number) {
  if (!value) return "0.00";
  const num = Number(value);

  if (num < 1) {
    return `${decimalFloat(value)}`;
  }

  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return digit ? num.toFixed(digit) : num.toString();
}
